import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/services/supabase-client.js', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { suggestProductsFromImage, getMarketPriceReference } from '../../src/services/ai-service.js';
import { supabase } from '../../src/services/supabase-client.js';

describe('suggestProductsFromImage', () => {
  it('returns suggestions on success', async () => {
    const mockSuggestions = [{ name: 'Ống PVC', confidence: 0.9 }];
    supabase.functions.invoke.mockResolvedValue({ data: { suggestions: mockSuggestions }, error: null });
    const { suggestions, error } = await suggestProductsFromImage(new File([], 'test.jpg'));
    expect(suggestions).toEqual(mockSuggestions);
    expect(error).toBeNull();
  });

  it('returns empty array on provider error', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: new Error('Provider timeout') });
    const { suggestions, error } = await suggestProductsFromImage(new File([], 'test.jpg'));
    expect(suggestions).toHaveLength(0);
    expect(error).toBeDefined();
  });

  it('returns empty suggestions (not null) when response has no suggestions key', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: {}, error: null });
    const { suggestions } = await suggestProductsFromImage(new File([], 'test.jpg'));
    expect(Array.isArray(suggestions)).toBe(true);
  });
});

describe('getMarketPriceReference', () => {
  it('returns price range and sources on success', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: { priceLow: 100000, priceHigh: 150000, sources: [{ url: 'https://example.com', retrievedAt: '2026-11-01' }] },
      error: null,
    });
    const { priceLow, priceHigh, sources, error } = await getMarketPriceReference({ name: 'Ống PVC' });
    expect(priceLow).toBe(100000);
    expect(priceHigh).toBe(150000);
    expect(sources).toHaveLength(1);
    expect(error).toBeNull();
  });

  it('returns nulls on provider error', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: new Error('API quota exceeded') });
    const { priceLow, priceHigh, error } = await getMarketPriceReference({ name: 'Ống PVC' });
    expect(priceLow).toBeNull();
    expect(priceHigh).toBeNull();
    expect(error).toBeDefined();
  });
});

