import { NextResponse } from 'next/server';
import { voteComment } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { commentId: string } }) {
  const body = await req.json();
  // body should contain threadId and delta
  const threadId = body.threadId;
  const delta = typeof body.delta === 'number' ? body.delta : 0;
  if (!threadId) return NextResponse.json({ error: 'threadId required' }, { status: 400 });
  const comment = await voteComment(threadId, params.commentId, delta);
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(comment);
}
