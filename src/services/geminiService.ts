const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export const geminiService = {
  async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [
          {
            text: systemInstruction,
          },
        ],
      };
    }

    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const isRetryable = response.status === 429 || response.status >= 500;
          if (isRetryable && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 500;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data: GeminiResponse = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('No response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        lastError = error;
        const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
        if (isNetworkError && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        if (attempt === maxRetries) break;
      }
    }

    console.error('Gemini API call failed after retries:', lastError);
    throw lastError;
  },

  async parseJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
    const response = await this.generateContent(prompt, systemInstruction);

    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    const cleaned = response.replace(/```\w*\s*/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  },
};
