// Vercel Edge Function — proxies requests to OpenAI so the API key
// never reaches the browser. The frontend calls /api/openai instead
// of api.openai.com directly.
//
// Set OPENAI_API_KEY (NOT prefixed with VITE_) in Vercel's
// Environment Variables. A non-VITE_-prefixed variable is only ever
// readable on the server, never bundled into client-side code.

export const config = { runtime: 'edge' };

const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const CHAT_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: { message: 'Method not allowed' } }, 405);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(
      { error: { message: 'OPENAI_API_KEY is not configured on the server' } },
      500,
    );
  }

  let body: { endpoint?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  const { endpoint, payload } = body;
  const url = endpoint === 'chat' ? CHAT_URL : RESPONSES_URL;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return json(
      { error: { message: err instanceof Error ? err.message : 'Upstream fetch failed' } },
      502,
    );
  }
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
