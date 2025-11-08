import { NextRequest, NextResponse } from 'next/server';
import { addPRComment } from '@/app/lib/github';
import type { PRComment } from '@/app/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, prNumber, comment } = body;
    
    if (!owner || !repo || !prNumber || !comment) {
      return NextResponse.json(
        { error: 'Owner, repo, PR number, and comment are required' },
        { status: 400 }
      );
    }
    
    await addPRComment(owner, repo, prNumber, comment as PRComment);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('GitHub comment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}

