import { getModel } from './gemini-config';
import type { TranscriptSegment, CodeReference } from '@/app/types';

export interface TranscriptionResult {
  transcript: TranscriptSegment[];
  codeReferences: CodeReference[];
  fullText: string;
}

/**
 * Transcribe audio/video and detect code references using Gemini
 */
export async function transcribeWithGemini(
  audioText: string,
  startTime: number = 0
): Promise<TranscriptionResult> {
  const model = getModel('pro');
  
  const prompt = `You are a code transcription assistant. Analyze the following transcript from a pair programming session and:

1. Break it into logical segments with timestamps
2. Detect any file names mentioned (e.g., "app/page.tsx", "src/components/Button.tsx")
3. Detect any line numbers mentioned (e.g., "line 42", "around line 100")
4. Detect function names, class names, or code references

Transcript:
${audioText}

Return a JSON object with this structure:
{
  "segments": [
    {
      "text": "segment text",
      "timestamp": 0.0,
      "speaker": "optional speaker name"
    }
  ],
  "codeReferences": [
    {
      "fileName": "app/page.tsx",
      "lineNumber": 42,
      "context": "mentioned in discussion",
      "timestamp": 0.0
    }
  ]
}

Only return valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response (remove markdown code blocks if present)
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    const transcript: TranscriptSegment[] = parsed.segments.map((seg: any, idx: number) => ({
      id: `seg-${idx}`,
      timestamp: seg.timestamp + startTime,
      text: seg.text,
      speaker: seg.speaker,
    }));
    
    const codeReferences: CodeReference[] = parsed.codeReferences.map((ref: any, idx: number) => ({
      id: `ref-${idx}`,
      timestamp: ref.timestamp + startTime,
      fileName: ref.fileName,
      lineNumber: ref.lineNumber,
      context: ref.context,
    }));
    
    return {
      transcript,
      codeReferences,
      fullText: audioText,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    // Fallback: return basic transcript
    return {
      transcript: [{
        id: 'seg-0',
        timestamp: startTime,
        text: audioText,
      }],
      codeReferences: [],
      fullText: audioText,
    };
  }
}

/**
 * Detect code references in text using Gemini Flash (faster, cheaper)
 */
export async function detectCodeReferences(text: string): Promise<CodeReference[]> {
  const model = getModel('flash');
  
  const prompt = `Extract code references from this text. Look for:
- File paths (e.g., "app/page.tsx", "src/components/Button.tsx")
- Line numbers (e.g., "line 42", "around line 100")
- Function/class names mentioned

Text: ${text}

Return JSON array:
[
  {
    "fileName": "app/page.tsx",
    "lineNumber": 42,
    "context": "what was mentioned about it"
  }
]

Only return valid JSON array, no markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    return parsed.map((ref: any, idx: number) => ({
      id: `ref-${idx}`,
      timestamp: 0, // Will be set by caller
      fileName: ref.fileName,
      lineNumber: ref.lineNumber,
      context: ref.context,
    }));
  } catch (error) {
    console.error('Code detection error:', error);
    return [];
  }
}

