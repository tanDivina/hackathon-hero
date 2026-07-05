import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Authentication required. Please log in to use AI features.');
  }
  return session.access_token;
}

export const geminiService = {
  async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    const token = await getAuthToken();

    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt, systemInstruction }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(data.error ?? 'AI rate limit reached. Please wait before trying again.');
          }
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in to use AI features.');
          }
          const isRetryable = response.status >= 500;
          if (isRetryable && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
            continue;
          }
          throw new Error(`AI service error: ${response.status}`);
        }

        const geminiData = data as GeminiResponse;
        if (!geminiData.candidates || geminiData.candidates.length === 0) {
          throw new Error('No response from AI service');
        }
        return geminiData.candidates[0].content.parts[0].text;
      } catch (error) {
        lastError = error;
        if (error instanceof Error && (
          error.message.includes('rate limit') ||
          error.message.includes('Authentication')
        )) {
          throw error;
        }
        const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
        if (isNetworkError && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
          continue;
        }
        if (attempt === maxRetries) break;
      }
    }

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
