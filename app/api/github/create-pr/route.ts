import { NextRequest, NextResponse } from 'next/server';
import { createDraftPR } from '@/app/lib/github';
import type { PRDraft } from '@/app/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, pr } = body;
    
    if (!owner || !repo || !pr) {
      return NextResponse.json(
        { error: 'Owner, repo, and PR data are required' },
        { status: 400 }
      );
    }
    
    const result = await createDraftPR(owner, repo, pr as PRDraft);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GitHub PR creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create PR' },
      { status: 500 }
    );
  }
}

