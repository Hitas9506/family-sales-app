/**
 * AI service — calls Supabase Edge Functions.
 * API keys live server-side; frontend never sees them.
 * All suggestions require human confirmation before use.
 */
import { supabase } from './supabase-client.js';

/**
 * Suggest products from an uploaded image.
 * Returns a list of suggestions that MUST be confirmed by the user before use.
 * @param {File} file
 * @param {{ query?: string }} [context]
 * @returns {Promise<{ suggestions: Array, error: Error|null }>}
 */
export async function suggestProductsFromImage(file, context = {}) {
  if (!supabase) return { suggestions: [], error: new Error('Offline mode.') };
  try {
    const formData = new FormData();
    formData.append('image', file);
    if (context.query) formData.append('query', context.query);

    const { data, error } = await supabase.functions.invoke('product-image-suggest', {
      body: formData,
    });
    if (error) return { suggestions: [], error };
    return { suggestions: data?.suggestions ?? [], error: null };
  } catch (err) {
    return { suggestions: [], error: err };
  }
}

/**
 * Get market price reference for a product.
 * Result is reference only — never auto-applied to product pricing.
 * @param {{ id?: string, name: string, sku?: string }} product
 * @returns {Promise<{ priceLow: number|null, priceHigh: number|null, sources: Array, error: Error|null }>}
 */
export async function getMarketPriceReference(product) {
  if (!supabase) return { priceLow: null, priceHigh: null, sources: [], error: new Error('Offline mode.') };
  try {
    const { data, error } = await supabase.functions.invoke('market-price-reference', {
      body: { productName: product.name, sku: product.sku },
    });
    if (error) return { priceLow: null, priceHigh: null, sources: [], error };
    return {
      priceLow: data?.priceLow ?? null,
      priceHigh: data?.priceHigh ?? null,
      sources: data?.sources ?? [],
      error: null,
    };
  } catch (err) {
    return { priceLow: null, priceHigh: null, sources: [], error: err };
  }
}

