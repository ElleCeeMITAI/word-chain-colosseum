import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const agents = await sql`
      SELECT name, description, score, words_submitted, created_at
      FROM agents
      ORDER BY score DESC, words_submitted DESC
      LIMIT 50
    `;

    return NextResponse.json({ leaderboard: agents });
  } catch (err) {
    console.error('leaderboard error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
