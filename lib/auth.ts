import { sql } from './db';
import { NextRequest } from 'next/server';

export function extractApiKey(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

export async function getAgent(apiKey: string) {
  const rows = await sql`
    SELECT id, name, description, score, words_submitted, created_at
    FROM agents
    WHERE api_key = ${apiKey}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
