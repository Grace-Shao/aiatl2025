// Orchestrator class to handle user prompts and delegate tasks to agents/tools

export class Orchestrator {
  private agents: Record<string, any>;

  constructor() {
    // Initialize agents/tools here
    this.agents = {
      memeGenerator: new MemeGeneratorAgent(),
      factChecker: new FactCheckingAgent(),
      opinionGenerator: new OpinionAgent(),
      gameStatistics: new GameStatisticsAgent(),
      emailSender: new EmailSenderAgent(),
    };
  }

  /**
   * Parses the user prompt and determines the task.
   * @param {string} prompt - The user input starting with @PrizePicksAI.
   * @returns {string} - The identified task.
   */
  parsePrompt(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    console.log('Parsing prompt:', prompt);
    console.log('Lower case:', lowerPrompt);
    
    if (lowerPrompt.includes('meme')) {
      console.log('Matched: memeGenerator');
      return 'memeGenerator';
    } else if (lowerPrompt.includes('fact check')) {
      console.log('Matched: factChecker');
      return 'factChecker';
    } else if (lowerPrompt.includes('email') || lowerPrompt.includes('send') && lowerPrompt.includes('friend')) {
      console.log('Matched: emailSender');
      return 'emailSender';
    } else if (lowerPrompt.includes('opinion') || lowerPrompt.includes('prediction')) {
      console.log('Matched: opinionGenerator');
      return 'opinionGenerator';
    } else if (
      lowerPrompt.includes('stat') || 
      lowerPrompt.includes('yard') || 
      lowerPrompt.includes('score') ||
      lowerPrompt.includes('how many') ||
      lowerPrompt.includes('rush') ||
      lowerPrompt.includes('pass')
    ) {
      console.log('Matched: gameStatistics');
      return 'gameStatistics';
    } else {
      console.log('No match found!');
      throw new Error('Unknown task in prompt');
    }
  }

  /**
   * Routes the task to the appropriate agent/tool.
   * @param {string} task - The task to perform.
   * @param {string} prompt - The user input.
   * @param {any} context - Optional context (e.g., currentQuarter, timestamp).
   * @returns {Promise<any>} - The result from the agent/tool.
   */
  async routeTask(task: string, prompt: string, context?: any): Promise<any> {
    const agent = this.agents[task];
    if (!agent) {
      throw new Error(`Agent for task ${task} not found`);
    }
    // Pass context to agents that support it (like GameStatisticsAgent)
    if (context && typeof agent.handlePrompt === 'function') {
      return await agent.handlePrompt(prompt, context);
    }
    return await agent.handlePrompt(prompt);
  }

  /**
   * Main entry point for handling user prompts.
   * @param {string} prompt - The user input starting with @PrizePicksAI.
   * @param {any} context - Optional context (e.g., currentQuarter, timestamp).
   * @returns {Promise<any>} - The result from the orchestrated workflow.
   */
  async handlePrompt(prompt: string, context?: any): Promise<any> {
    try {
      const task = this.parsePrompt(prompt);
      return await this.routeTask(task, prompt, context);
    } catch (error) {
      console.error('Error handling prompt:', error);
      throw error;
    }
  }
}

// Placeholder classes for agents/tools
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class MemeGeneratorAgent {
  async handlePrompt(prompt: string): Promise<any> {
    console.log('Received prompt for meme generation:', prompt);
    const meme = await this.generateMeme(prompt);
    console.log('Generated meme:', meme);
    return meme;
  }

  private async generateMeme(prompt: string): Promise<{ text?: string; imagePath?: string; imageUrl?: string }> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    try {
      console.log('Sending request to Gemini Imagen 3 for meme generation...');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { 
                    text: `Generate a funny sports meme image about: ${prompt}. Make it humorous and relatable for sports fans.` 
                  }
                ]
              }
            ],
            generationConfig: {
              responseModalities: ["image"]
            }
          }),
        }
      );

      console.log('Gemini response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini error response:', errorText);
        throw new Error(`Failed to generate meme: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Gemini response:', JSON.stringify(data, null, 2));

      const result: { text?: string; imagePath?: string; imageUrl?: string } = {};

      // Process all parts in the response
      const parts = data.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        throw new Error('Gemini returned no content parts');
      }

      for (const part of parts) {
        if (part.text) {
          result.text = part.text.trim();
          console.log('Text part:', result.text);
        } else if (part.inlineData) {
          // Save the image
          const imageData = part.inlineData.data; // base64 encoded image
          const mimeType = part.inlineData.mimeType || 'image/png';
          const extension = mimeType.split('/')[1] || 'png';
          
          // Create public directory if it doesn't exist
          const publicDir = path.join(process.cwd(), 'public', 'generated-memes');
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }

          // Generate unique filename
          const timestamp = Date.now();
          const filename = `meme_${timestamp}.${extension}`;
          const filepath = path.join(publicDir, filename);

          // Decode and save the image
          const buffer = Buffer.from(imageData, 'base64');
          fs.writeFileSync(filepath, buffer);

          result.imagePath = filepath;
          result.imageUrl = `/generated-memes/${filename}`;
          console.log('Image saved to:', filepath);
          console.log('Image URL:', result.imageUrl);
        }
      }

      if (!result.text && !result.imageUrl) {
        throw new Error('Gemini returned neither text nor image');
      }

      return result;
    } catch (error) {
      console.error('Error generating meme:', error);
      throw error;
    }
  }
}

class FactCheckingAgent {
  async handlePrompt(prompt: string): Promise<string> {
    const facts = await this.checkFacts(prompt);
    return facts;
  }

  private async checkFacts(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    try {
      // Fetch game data for context
      const gameDataRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/game-data`);
      const gameData = await gameDataRes.json();

      console.log('Fact checking with game data:', gameData);

      // Use Gemini to fact-check with real data
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { 
                    text: `You are a sports fact-checker. Use the following game data to fact-check this statement:

Statement: ${prompt}

Game Data: ${JSON.stringify(gameData, null, 2)}

Provide a SHORT, BRIEF fact-check (2-3 sentences MAX) in PLAIN TEXT (NO MARKDOWN):
- Use ✅ for TRUE or ❌ for FALSE
- NO asterisks, NO bold formatting, NO markdown syntax
- Just use emojis and plain text
- Keep it concise and cite specific numbers from the data
- Write naturally like a tweet` 
                  }
                ]
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const factCheck = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!factCheck) {
        throw new Error('No fact-check response from Gemini');
      }

      return factCheck;
    } catch (error) {
      console.error('Error fact-checking:', error);
      return `Unable to fact-check at this time: ${error}`;
    }
  }
}

class OpinionAgent {
  async handlePrompt(prompt: string): Promise<string> {
    const opinion = await this.generateOpinion(prompt);
    return opinion;
  }

  private async generateOpinion(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    try {
      // Fetch game data for context
      const gameDataRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/game-data`);
      const gameData = await gameDataRes.json();

      console.log('Generating opinion with game data:', gameData);

      // Use Gemini to generate opinions/predictions
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { 
                    text: `You are a sports analyst giving opinions and predictions. Use the following game data to provide an informed opinion:

Question: ${prompt}

Game Data: ${JSON.stringify(gameData, null, 2)}

Provide a SHORT, BRIEF analysis (3-4 sentences MAX) in PLAIN TEXT (NO MARKDOWN):
- Start with a clear prediction using 🏆 or 📊 emojis
- NO asterisks, NO bold formatting, NO bullet points, NO markdown syntax
- Just use emojis and plain text
- Write naturally like a tweet with line breaks for readability
- Keep it punchy and engaging` 
                  }
                ]
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const opinion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!opinion) {
        throw new Error('No opinion response from Gemini');
      }

      return opinion;
    } catch (error) {
      console.error('Error generating opinion:', error);
      return `Unable to generate opinion at this time: ${error}`;
    }
  }
}

class GameStatisticsAgent {
  async handlePrompt(prompt: string, context?: { currentQuarter?: number; timestamp?: string }): Promise<string> {
    console.log('GameStatisticsAgent.handlePrompt called with:', prompt, 'context:', context);
    const stats = await this.getGameStatistics(prompt, context);
    console.log('GameStatisticsAgent returning:', stats);
    return stats;
  }

  private async getGameStatistics(
    prompt: string, 
    context?: { currentQuarter?: number; timestamp?: string }
  ): Promise<string> {
    console.log('getGameStatistics called with prompt:', prompt, 'context:', context);
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    try {
      // Default to end of game (Quarter 4) if not specified
      const currentQuarter = context?.currentQuarter ?? 4;
      const isLiveGame = currentQuarter < 4;
      
      console.log(`Fetching game data for Quarter ${currentQuarter}...`);
      
      // Fetch game data for context
      const gameDataRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/game-data`);
      const gameData = await gameDataRes.json();

      console.log('Analyzing game statistics with game data:', gameData);

      // Build temporal context for Gemini
      const temporalContext = isLiveGame 
        ? `IMPORTANT: This is during Quarter ${currentQuarter} of the game. You can ONLY use data available up to and during Quarter ${currentQuarter}. Do NOT provide information about future quarters or final game results.`
        : `This is the final game data (end of Quarter 4).`;

      // Use Gemini to answer statistics questions
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { 
                    text: `You are a sports statistics analyst. Use the following game data to answer the statistics question:

${temporalContext}

Question: ${prompt}

Game Data: ${JSON.stringify(gameData, null, 2)}

Provide a SHORT, CONCISE answer (2-3 sentences MAX) in PLAIN TEXT (NO MARKDOWN):
- Use 📊 for statistics and 🏈 for football-specific insights
- NO asterisks, NO bold formatting, NO markdown syntax
- Just use emojis and plain text
- Cite specific numbers and stats from the data
- Write naturally like a tweet
${isLiveGame ? '- Remember: only reference data from quarters that have been played so far!' : ''}` 
                  }
                ]
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const statistics = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!statistics) {
        throw new Error('No statistics response from Gemini');
      }

      return statistics;
    } catch (error) {
      console.error('Error analyzing game statistics:', error);
      return `Unable to retrieve game statistics at this time: ${error}`;
    }
  }
}

class EmailSenderAgent {
  async handlePrompt(prompt: string): Promise<string> {
    const result = await this.sendGameEmail(prompt);
    return result;
  }

  private async sendGameEmail(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    try {
      // Fetch game data for context
      const gameDataRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/game-data`);
      const gameData = await gameDataRes.json();

      console.log('Generating email content with game data:', gameData);

      // Use Gemini to compose an engaging email about the game
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { 
                    text: `You are composing an exciting email to friends about a live sports game. Use the following game data:

Request: ${prompt}

Game Data: ${JSON.stringify(gameData, null, 2)}

Generate an email with:
1. Subject line (exciting and attention-grabbing)
2. Email body (engaging, 3-4 paragraphs highlighting key stats, player performances, and exciting moments)

Format as JSON:
{
  "subject": "your subject here",
  "body": "your email body here"
}

Make it enthusiastic and packed with the actual stats from the data!` 
                  }
                ]
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const emailContent = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!emailContent) {
        throw new Error('No email content response from Gemini');
      }

      // Parse the JSON response
      const jsonMatch = emailContent.match(/\{[\s\S]*\}/);
      let emailData;
      if (jsonMatch) {
        emailData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse email content');
      }

      // Send the email using the API
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'Alex, Ryan, Maya', // Default to first friend group
          subject: emailData.subject,
          message: emailData.body,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send email');
      }

      return `📧 Email sent successfully!\n\nSubject: ${emailData.subject}\n\nPreview: ${emailData.body.substring(0, 100)}...`;
    } catch (error) {
      console.error('Error sending game email:', error);
      return `Unable to send email at this time: ${error}`;
    }
  }
}