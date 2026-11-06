import { describe, expect, it } from 'vitest';
import { createProduct, resolveSalePrice } from '../../src/domain/products.js';

describe('product pricing', () => {
  const product = createProduct({ name: 'Ống phi 21', baseUnit: 'cây', retailUnit: 'mét', unitsPerBase: 4, wholesalePrice: 120000, retailPrice: 35000 });
  it('uses wholesale price for base and retail price for retail', () => {
    expect(resolveSalePrice(product, 'base', 1)).toBe(120000);
    expect(resolveSalePrice(product, 'retail', 1)).toBe(35000);
  });
});
