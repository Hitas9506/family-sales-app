// Supabase Edge Function: market-price-reference
// Secrets: GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX (Custom Search Engine ID)
// API keys NEVER leave this function.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SEARCH_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY');
const SEARCH_CX = Deno.env.get('GOOGLE_SEARCH_CX');

serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  if (!SEARCH_API_KEY || !SEARCH_CX) {
    return new Response(JSON.stringify({ error: 'Search API not configured' }), { status: 500 });
  }

  try {
    const { productName, sku } = await req.json();
    if (!productName) {
      return new Response(JSON.stringify({ error: 'productName required' }), { status: 400 });
    }

    const query = encodeURIComponent(`${productName}${sku ? ' ' + sku : ''} giá bán`);
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${SEARCH_API_KEY}&cx=${SEARCH_CX}&q=${query}&num=5`;

    const resp = await fetch(searchUrl);
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Search provider error' }), { status: 502 });
    }

    const searchData = await resp.json();
    const sources = (searchData.items ?? []).map((item: { title: string; link: string; snippet: string }) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      retrievedAt: new Date().toISOString(),
    }));

    // Extract price range heuristically from snippets (regex for VND amounts)
    const prices: number[] = [];
    const priceRe = /(\d[\d.,]+)\s*(đ|₫|đồng|vnd)/gi;
    for (const src of sources) {
      let m: RegExpExecArray | null;
      while ((m = priceRe.exec(src.snippet)) !== null) {
        const val = parseFloat(m[1].replace(/[.,]/g, ''));
        if (val > 1000) prices.push(val);
      }
    }

    prices.sort((a, b) => a - b);
    const priceLow = prices.length ? prices[0] : null;
    const priceHigh = prices.length ? prices[prices.length - 1] : null;

    return new Response(JSON.stringify({ priceLow, priceHigh, sources }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

