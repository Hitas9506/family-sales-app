// Supabase Edge Function: product-image-suggest
// Secrets: GEMINI_API_KEY (set via: supabase secrets set GEMINI_API_KEY=...)
// API key NEVER leaves this function.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const query = formData.get('query') as string ?? '';

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'Missing image' }), { status: 400 });
    }

    const imageBytes = await imageFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));

    const geminiBody = {
      contents: [{
        parts: [
          { text: `Identify this construction/hardware product${query ? ` related to: ${query}` : ''}. Return JSON: { suggestions: [{ name, description, confidence }] }` },
          { inline_data: { mime_type: imageFile.type, data: base64Image } },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json' },
    };

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
    );

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'AI provider error', status: resp.status }), { status: 502 });
    }

    const geminiData = await resp.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify({ suggestions: parsed.suggestions ?? [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

