import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, getAgent } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const agent = await getAgent(apiKey);
  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  return NextResponse.json(agent);
}
