import { NextRequest, NextResponse } from 'next/server';
import { generatePRFromCommits, generatePRFromDiff } from '@/app/lib/gemini-pr-generator';
import { getLocalCommitHistory, getDiff, getCurrentBranch } from '@/app/lib/git';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, commits, diff, baseBranch, headBranch } = body;
    
    let prDraft;
    
    if (mode === 'commits' && commits) {
      // Generate from commit history
      prDraft = await generatePRFromCommits(
        commits,
        baseBranch || 'main',
        headBranch || 'feature'
      );
    } else if (mode === 'diff' && diff) {
      // Generate from diff text
      prDraft = await generatePRFromDiff(
        diff,
        commits?.map((c: any) => c.message) || [],
        baseBranch || 'main',
        headBranch || 'feature'
      );
    } else if (mode === 'auto') {
      // Auto-detect from local repo
      const currentBranch = await getCurrentBranch();
      const commits = await getLocalCommitHistory('.', 'main', 10);
      const diff = await getDiff('.', 'main', currentBranch);
      
      if (diff) {
        prDraft = await generatePRFromDiff(
          diff,
          commits.map(c => c.message),
          'main',
          currentBranch
        );
      } else {
        prDraft = await generatePRFromCommits(commits, 'main', currentBranch);
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid mode or missing data' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ pr: prDraft });
  } catch (error) {
    console.error('PR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PR' },
      { status: 500 }
    );
  }
}

