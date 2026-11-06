import { describe, expect, it } from 'vitest';
import { formatCurrency, formatQuantity } from '../../src/core/format.js';

describe('format helpers', () => {
  it('formats Vietnamese currency without decimal digits', () => {
    expect(formatCurrency(1250000)).toBe('1.250.000 ₫');
  });

  it('formats decimal quantities using Vietnamese separators', () => {
    expect(formatQuantity(2.5)).toBe('2,5');
  });
});
