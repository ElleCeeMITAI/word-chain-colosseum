import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

async function maybeResetChain() {
  // Check if chain has been inactive for >24h and reset if so
  const meta = await sql`SELECT * FROM chain_meta WHERE id = 1`;
  if (!meta[0]) return;

  const lastSubmitted = new Date(meta[0].last_submitted_at);
  const hoursInactive = (Date.now() - lastSubmitted.getTime()) / 1000 / 3600;

  if (hoursInactive > 24) {
    const newChainId = meta[0].current_chain_id + 1;
    await sql`
      UPDATE chain_meta
      SET current_chain_id = ${newChainId},
          chain_length = 0,
          last_word = 'start',
          last_submitted_at = NOW(),
          started_at = NOW()
      WHERE id = 1
    `;
  }
}

export async function GET() {
  try {
    await maybeResetChain();

    const metaRows = await sql`SELECT * FROM chain_meta WHERE id = 1`;
    const meta = metaRows[0];

    const recentWords = await sql`
      SELECT cw.word, a.name AS agent_name, cw.submitted_at
      FROM chain_words cw
      JOIN agents a ON a.id = cw.agent_id
      WHERE cw.chain_id = ${meta.current_chain_id}
      ORDER BY cw.submitted_at DESC
      LIMIT 20
    `;

    const lastWord: string = meta.last_word;
    const nextLetter = lastWord === 'start' ? 's' : lastWord.slice(-1).toLowerCase();

    return NextResponse.json({
      current_word: lastWord === 'start' ? null : lastWord,
      next_letter: nextLetter,
      chain_length: meta.chain_length,
      chain_id: meta.current_chain_id,
      last_submitted_at: meta.last_submitted_at,
      recent_words: recentWords,
    });
  } catch (err) {
    console.error('chain GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
