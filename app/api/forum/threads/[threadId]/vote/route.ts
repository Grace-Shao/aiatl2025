import { NextResponse } from 'next/server';
import { voteThread } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { threadId: string } }) {
  const body = await req.json();
  const delta = typeof body.delta === 'number' ? body.delta : 0;
  const thread = await voteThread(params.threadId, delta);
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  return NextResponse.json(thread);
}
