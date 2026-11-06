import { describe, it, expect } from 'vitest';
import { getProductImportColumns, parseProductRows } from '../../src/import/excel-parser.js';

describe('getProductImportColumns', () => {
  it('returns expected column headers', () => {
    const cols = getProductImportColumns();
    expect(cols).toContain('Tên sản phẩm');
    expect(cols).toContain('Mã hàng');
    expect(cols).toContain('Đơn vị nguyên');
    expect(cols).toContain('Đơn vị lẻ');
    expect(cols).toContain('Quy đổi (1 nguyên = ? lẻ)');
    expect(cols).toContain('Giá sỉ (đồng)');
    expect(cols).toContain('Giá lẻ (đồng)');
  });
});

describe('parseProductRows', () => {
  const validRow = {
    'Tên sản phẩm': 'Ống nước PVC phi 21',
    'Mã hàng': 'ONG-21',
    'Đơn vị nguyên': 'cây',
    'Đơn vị lẻ': 'mét',
    'Quy đổi (1 nguyên = ? lẻ)': 4,
    'Giá sỉ (đồng)': 120000,
    'Giá lẻ (đồng)': 35000,
  };

  it('parses valid row successfully', () => {
    const { rows, warnings } = parseProductRows([validRow]);
    expect(rows).toHaveLength(1);
    expect(warnings).toHaveLength(0);
    expect(rows[0].name).toBe('Ống nước PVC phi 21');
    expect(rows[0].unitsPerBase).toBe(4);
    expect(rows[0].wholesalePrice).toBe(120000);
  });

  it('warns on duplicate SKU', () => {
    const { rows, warnings } = parseProductRows([validRow, { ...validRow }]);
    expect(warnings.some(w => w.includes('ONG-21'))).toBe(true);
    expect(rows).toHaveLength(1);
  });

  it('warns and skips row with missing conversion', () => {
    const bad = { ...validRow, 'Quy đổi (1 nguyên = ? lẻ)': '', 'Mã hàng': 'BAD-01' };
    const { rows, warnings } = parseProductRows([bad]);
    expect(rows).toHaveLength(0);
    expect(warnings.some(w => w.includes('Quy đổi'))).toBe(true);
  });

  it('warns and skips row with invalid numeric price', () => {
    const bad = { ...validRow, 'Giá sỉ (đồng)': 'abc', 'Mã hàng': 'XXX-01' };
    const { rows, warnings } = parseProductRows([bad]);
    expect(rows).toHaveLength(0);
    expect(warnings.some(w => w.includes('Giá sỉ'))).toBe(true);
  });

  it('warns and skips row with missing product name', () => {
    const bad = { ...validRow, 'Tên sản phẩm': '', 'Mã hàng': 'YYY-01' };
    const { rows, warnings } = parseProductRows([bad]);
    expect(rows).toHaveLength(0);
    expect(warnings.some(w => w.includes('Tên sản phẩm'))).toBe(true);
  });
});

