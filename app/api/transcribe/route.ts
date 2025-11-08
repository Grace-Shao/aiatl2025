import { NextRequest, NextResponse } from 'next/server';
import { transcribeWithGemini, detectCodeReferences } from '@/app/lib/gemini-transcription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, startTime = 0 } = body;
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript text is required' },
        { status: 400 }
      );
    }
    
    // Use Gemini to transcribe and detect code references
    const result = await transcribeWithGemini(transcript, startTime);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription' },
      { status: 500 }
    );
  }
}

