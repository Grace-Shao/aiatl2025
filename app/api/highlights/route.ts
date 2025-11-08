import { NextRequest, NextResponse } from 'next/server';
import { generateHighlights } from '@/app/lib/gemini-highlights';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, codeReferences } = body;
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }
    
    const highlights = await generateHighlights(transcript, codeReferences);
    
    return NextResponse.json({ highlights });
  } catch (error) {
    console.error('Highlights generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate highlights' },
      { status: 500 }
    );
  }
}

