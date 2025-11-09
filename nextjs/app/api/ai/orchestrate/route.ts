import { NextResponse } from 'next/server';
import { Orchestrator } from '../../_lib/orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt: string = body?.prompt;
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    console.log('Orchestrator route received prompt:', prompt);
    const orchestrator = new Orchestrator();
    const result = await orchestrator.handlePrompt(prompt);

    console.log('Orchestrator result:', result);

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('Error in /api/ai/orchestrate:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
