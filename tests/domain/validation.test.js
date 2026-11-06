import { describe, expect, it } from 'vitest';
import { validateConversion, validateProduct, validateQuantity } from '../../src/domain/validation.js';

describe('domain validation', () => {
  it('accepts product with base and retail conversion', () => {
    expect(validateProduct({ name: 'Ống phi 21', baseUnit: 'cây', retailUnit: 'mét', unitsPerBase: 4 })).toEqual({ valid: true, errors: [] });
  });

  it('rejects non-positive quantities and conversions', () => {
    expect(validateQuantity(0).valid).toBe(false);
    expect(validateQuantity(-1).valid).toBe(false);
    expect(validateConversion(0).valid).toBe(false);
  });

  it('rejects missing product name and units', () => {
    const result = validateProduct({ name: '', baseUnit: '', retailUnit: '', unitsPerBase: 4 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Tên sản phẩm là bắt buộc');
  });
});
