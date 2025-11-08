import { NextResponse } from 'next/server';
import { addThread, getThreads } from '@/lib/db';

export async function GET() {
  const threads = await getThreads();
  return NextResponse.json(threads);
}

export async function POST(req: Request) {
  const body = await req.json();
  // expected: { id?, title, author, excerpt, votes }
  const thread = await addThread({
    id: body.id ?? `t-${Date.now()}`,
    title: body.title ?? 'Untitled',
    author: body.author ?? 'Moderator',
    excerpt: body.excerpt ?? '',
    timestamp: new Date().toISOString(),
    votes: body.votes ?? 0,
  });

  return NextResponse.json(thread, { status: 201 });
}
