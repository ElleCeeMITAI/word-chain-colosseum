import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { extractApiKey, getAgent } from '@/lib/auth';
import { isValidEnglishWord } from '@/lib/validate-word';

export async function POST(req: NextRequest) {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const agent = await getAgent(apiKey);
  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  let body: { word?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', reason: 'invalid' }, { status: 400 });
  }

  const word: string =
    typeof body.word === 'string' ? body.word.trim().toLowerCase() : '';

  if (!word || word.length === 0) {
    return NextResponse.json({ error: 'word is required', reason: 'invalid' }, { status: 400 });
  }
  if (!/^[a-z]+$/.test(word)) {
    return NextResponse.json(
      { error: 'word must contain only letters', reason: 'invalid' },
      { status: 400 }
    );
  }

  // Validate English before touching the DB (saves DB write on bad words)
  const valid = await isValidEnglishWord(word);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Not a valid English word', reason: 'not_english' },
      { status: 422 }
    );
  }

  // Atomic CTE: check + insert + update in a single query to minimize race window
  // Returns inserted=true if all conditions passed, false otherwise.
  const rows = await sql`
    WITH
      meta AS (
        SELECT
          current_chain_id,
          chain_length,
          last_word,
          last_submitted_at,
          EXTRACT(EPOCH FROM (NOW() - last_submitted_at)) / 3600 AS hours_inactive
        FROM chain_meta
        WHERE id = 1
      ),
      reset_chain AS (
        UPDATE chain_meta
        SET
          current_chain_id = current_chain_id + 1,
          chain_length      = 0,
          last_word         = 'start',
          last_submitted_at = NOW(),
          started_at        = NOW()
        WHERE id = 1
          AND (SELECT hours_inactive FROM meta) > 24
        RETURNING current_chain_id
      ),
      effective_meta AS (
        SELECT
          COALESCE(
            (SELECT current_chain_id FROM reset_chain),
            (SELECT current_chain_id FROM meta)
          ) AS chain_id,
          CASE
            WHEN (SELECT hours_inactive FROM meta) > 24 THEN 0
            ELSE (SELECT chain_length FROM meta)
          END AS chain_length,
          CASE
            WHEN (SELECT hours_inactive FROM meta) > 24 THEN 'start'
            ELSE (SELECT last_word FROM meta)
          END AS last_word,
          (SELECT hours_inactive FROM meta) > 24 AS was_reset
      ),
      expected AS (
        SELECT
          CASE
            WHEN last_word = 'start' THEN 's'
            ELSE LOWER(RIGHT(last_word, 1))
          END AS letter,
          chain_id,
          chain_length,
          was_reset
        FROM effective_meta
      ),
      insert_word AS (
        INSERT INTO chain_words (word, agent_id, chain_id)
        SELECT
          ${word},
          ${agent.id as string}::uuid,
          (SELECT chain_id FROM expected)
        WHERE
          LEFT(${word}, 1) = (SELECT letter FROM expected)
          AND NOT EXISTS (
            SELECT 1 FROM chain_words
            WHERE chain_id = (SELECT chain_id FROM expected)
              AND word = ${word}
          )
        RETURNING id
      ),
      update_meta AS (
        UPDATE chain_meta
        SET
          last_word         = ${word},
          chain_length      = (SELECT chain_length FROM expected) + 1,
          last_submitted_at = NOW()
        WHERE id = 1
          AND EXISTS (SELECT 1 FROM insert_word)
        RETURNING chain_length
      ),
      update_agent AS (
        UPDATE agents
        SET
          score            = score + 1,
          words_submitted  = words_submitted + 1
        WHERE id = ${agent.id as string}::uuid
          AND EXISTS (SELECT 1 FROM insert_word)
        RETURNING score
      )
    SELECT
      (SELECT COUNT(*) FROM insert_word)::int   AS inserted,
      (SELECT letter   FROM expected)           AS expected_letter,
      (SELECT was_reset FROM expected)          AS was_reset,
      (SELECT score    FROM update_agent)       AS new_score
  `;

  const row = rows[0];
  const inserted = Number(row.inserted) > 0;

  if (!inserted) {
    // Determine why: wrong letter or duplicate
    const wasReset = row.was_reset;
    if (wasReset) {
      return NextResponse.json(
        { success: false, error: 'Chain was reset — submit a word starting with s', reason: 'chain_reset' },
        { status: 422 }
      );
    }
    const firstLetter = word[0];
    const expectedLetter: string = row.expected_letter;
    if (firstLetter !== expectedLetter) {
      return NextResponse.json(
        {
          success: false,
          error: `Word must start with '${expectedLetter}'`,
          reason: 'wrong_letter',
        },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Word already used in this chain', reason: 'already_used' },
      { status: 422 }
    );
  }

  return NextResponse.json({
    success: true,
    word,
    points_earned: 1,
    new_score: Number(row.new_score),
  });
}
