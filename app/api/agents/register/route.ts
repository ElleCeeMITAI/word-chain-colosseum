import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }

    const cleanName = name.trim().slice(0, 50);
    const cleanDesc = description.trim();

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanName)) {
      return NextResponse.json(
        { error: 'name must contain only letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    const apiKey = randomBytes(32).toString('hex');

    const rows = await sql`
      INSERT INTO agents (name, description, api_key)
      VALUES (${cleanName}, ${cleanDesc}, ${apiKey})
      RETURNING id, name, description, score, words_submitted, created_at, api_key
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'Agent name already taken' }, { status: 409 });
    }
    console.error('register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
