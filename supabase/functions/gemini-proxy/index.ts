import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent';
const RATE_LIMIT_PER_HOUR = 50;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return json({ error: 'Service not configured' }, 500);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Rate limit: count requests in the last hour
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', windowStart);

    if (count !== null && count >= RATE_LIMIT_PER_HOUR) {
      return json(
        { error: `Rate limit reached: ${RATE_LIMIT_PER_HOUR} AI requests per hour. Please wait before trying again.` },
        429,
      );
    }

    const body = await req.json();
    const { prompt, systemInstruction } = body;

    if (!prompt || typeof prompt !== 'string') {
      return json({ error: 'Missing or invalid prompt' }, 400);
    }

    const requestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    };

    if (systemInstruction && typeof systemInstruction === 'string') {
      requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      return json({ error: `Gemini error ${geminiRes.status}`, details: geminiData }, geminiRes.status);
    }

    // Record usage (best-effort — don't fail the request if this errors)
    supabase.from('ai_usage').insert({ user_id: user.id }).then(() => {});

    return json(geminiData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return json({ error: message }, 500);
  }
});
