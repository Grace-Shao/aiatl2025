import { NextResponse } from 'next/server';
import { addComment } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { threadId: string } }) {
  const body = await req.json();
  // expected: { text, author }
  const comment = await addComment(params.threadId, {
    text: body.text,
    author: body.author ?? 'Anonymous',
    votes: 0,
  });

  if (!comment) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  return NextResponse.json(comment, { status: 201 });
}
