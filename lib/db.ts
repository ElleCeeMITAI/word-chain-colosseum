import { neon } from '@neondatabase/serverless';

// Falls back to a valid-but-unused URL during Next.js build static analysis.
// API routes are never actually executed at build time, so no real query fires.
export const sql = neon(
  process.env.DATABASE_URL ?? 'postgresql://build:build@localhost/build'
);
