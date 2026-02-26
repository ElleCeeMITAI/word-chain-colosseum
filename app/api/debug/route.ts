import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  const url = process.env.DATABASE_URL;
  const urlPreview = url ? url.slice(0, 40) + '...' : 'NOT SET';

  try {
    const sql = neon(url ?? 'postgresql://build:build@localhost/build');
    const rows = await sql`SELECT 1 AS ok`;
    return NextResponse.json({ url_preview: urlPreview, db: 'connected', result: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ url_preview: urlPreview, db: 'failed', error: msg });
  }
}
