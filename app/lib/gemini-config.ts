import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

// Get the appropriate model based on use case
export function getModel(modelName: 'pro' | 'flash' = 'pro') {
  const client = getGeminiClient();
  const model = modelName === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
  return client.getGenerativeModel({ model });
}

// Configuration for different use cases
export const GEMINI_CONFIG = {
  transcription: {
    model: 'gemini-1.5-pro',
    temperature: 0.1,
    maxTokens: 4096,
  },
  highlights: {
    model: 'gemini-1.5-pro',
    temperature: 0.3,
    maxTokens: 2048,
  },
  prGeneration: {
    model: 'gemini-1.5-pro',
    temperature: 0.5,
    maxTokens: 4096,
  },
  codeDetection: {
    model: 'gemini-1.5-flash',
    temperature: 0.1,
    maxTokens: 1024,
  },
};

