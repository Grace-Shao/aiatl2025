import { getModel } from './gemini-config';
import type { Highlight } from '@/app/types';

/**
 * Generate AI highlights from transcript using Gemini
 */
export async function generateHighlights(
  transcript: string,
  codeReferences?: Array<{ fileName: string; lineNumber?: number; context?: string }>
): Promise<Highlight[]> {
  const model = getModel('pro');
  
  const codeRefsText = codeReferences && codeReferences.length > 0
    ? `\n\nCode references mentioned:\n${codeReferences.map(ref => 
        `- ${ref.fileName}${ref.lineNumber ? `:${ref.lineNumber}` : ''} - ${ref.context || ''}`
      ).join('\n')}`
    : '';
  
  const prompt = `Analyze this pair programming session transcript and extract key highlights:

1. **Decisions**: Important technical decisions made
2. **Discussion**: Key discussion points or debates
3. **Action Items**: Tasks or follow-ups mentioned

Transcript:
${transcript}${codeRefsText}

Return a JSON array of highlights:
[
  {
    "text": "summary of the highlight",
    "type": "decision" | "discussion" | "action-item",
    "importance": "high" | "medium" | "low",
    "timestamp": 0.0
  }
]

Only return valid JSON array, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    return parsed.map((h: any, idx: number) => ({
      id: `highlight-${idx}`,
      timestamp: h.timestamp || 0,
      text: h.text,
      type: h.type || 'discussion',
      importance: h.importance || 'medium',
    }));
  } catch (error) {
    console.error('Highlights generation error:', error);
    return [];
  }
}

/**
 * Generate a summary of the session
 */
export async function generateSessionSummary(transcript: string): Promise<string> {
  const model = getModel('pro');
  
  const prompt = `Summarize this pair programming session transcript in 2-3 paragraphs. Focus on:
- What was discussed
- Key decisions made
- Main outcomes or next steps

Transcript:
${transcript}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Summary generation error:', error);
    return 'Unable to generate summary.';
  }
}

