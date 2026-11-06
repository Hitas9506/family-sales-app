import { describe, expect, it } from 'vitest';
import { filterProducts } from '../../src/domain/products.js';

describe('product search', () => {
  const products = [
    { name: 'Ống nước PVC phi 21', sku: 'ONG-21' },
    { name: 'Dây điện Cadivi 2.5mm', sku: 'DAY-25' },
  ];

  it('filters by Vietnamese product name or SKU case-insensitively', () => {
    expect(filterProducts(products, 'phi 21')).toHaveLength(1);
    expect(filterProducts(products, 'day-25')[0].name).toBe('Dây điện Cadivi 2.5mm');
  });

  it('returns all products for empty query', () => {
    expect(filterProducts(products, '')).toEqual(products);
  });
});
