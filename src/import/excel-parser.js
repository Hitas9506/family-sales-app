/**
 * Excel import parser for product catalog.
 * Uses SheetJS (xlsx) to read workbooks; parseProductRows works on plain row objects
 * so it can be unit-tested without file I/O.
 */
import * as XLSX from 'xlsx';

const COLUMNS = [
  'Tên sản phẩm',
  'Mã hàng',
  'Đơn vị nguyên',
  'Đơn vị lẻ',
  'Quy đổi (1 nguyên = ? lẻ)',
  'Giá sỉ (đồng)',
  'Giá lẻ (đồng)',
];

/** Returns the expected column headers for the import template. */
export function getProductImportColumns() {
  return [...COLUMNS];
}

/**
 * Generates and triggers download of a blank import template .xlsx.
 */
export function downloadProductTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    COLUMNS,
    ['Ống nước PVC phi 21', 'ONG-21', 'cây', 'mét', 4, 120000, 35000],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm');
  XLSX.writeFile(wb, 'mau-nhap-hang-hoa.xlsx');
}

/**
 * Parse an ArrayBuffer from a .xlsx file into product rows.
 * @param {ArrayBuffer} buffer
 * @returns {{ rows: object[], warnings: string[] }}
 */
export function parseProductWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return parseProductRows(rawRows);
}

/**
 * Validate and deduplicate raw row objects (already keyed by column header).
 * Pure function — no file I/O — for testability.
 * @param {object[]} rawRows
 * @returns {{ rows: object[], warnings: string[] }}
 */
export function parseProductRows(rawRows) {
  const warnings = [];
  const seenSkus = new Set();
  const rows = [];

  rawRows.forEach((raw, idx) => {
    const lineRef = `Dòng ${idx + 2}`;
    const name = String(raw['Tên sản phẩm'] ?? '').trim();
    const sku = String(raw['Mã hàng'] ?? '').trim();
    const baseUnit = String(raw['Đơn vị nguyên'] ?? '').trim();
    const retailUnit = String(raw['Đơn vị lẻ'] ?? '').trim();
    const convRaw = raw['Quy đổi (1 nguyên = ? lẻ)'];
    const wholesaleRaw = raw['Giá sỉ (đồng)'];
    const retailRaw = raw['Giá lẻ (đồng)'];

    // Required text fields
    if (!name) {
      warnings.push(`${lineRef}: Tên sản phẩm bị trống — dòng bị bỏ qua.`);
      return;
    }

    // Conversion
    const unitsPerBase = Number(convRaw);
    if (!convRaw && convRaw !== 0 || !Number.isFinite(unitsPerBase) || unitsPerBase <= 0) {
      warnings.push(`${lineRef} (${name}): Quy đổi không hợp lệ ("${convRaw}") — dòng bị bỏ qua.`);
      return;
    }

    // Prices
    const wholesalePrice = Number(wholesaleRaw);
    if (!Number.isFinite(wholesalePrice) || wholesalePrice < 0) {
      warnings.push(`${lineRef} (${name}): Giá sỉ không hợp lệ ("${wholesaleRaw}") — dòng bị bỏ qua.`);
      return;
    }

    const retailPrice = Number(retailRaw);
    if (!Number.isFinite(retailPrice) || retailPrice < 0) {
      warnings.push(`${lineRef} (${name}): Giá lẻ không hợp lệ ("${retailRaw}") — dòng bị bỏ qua.`);
      return;
    }

    // Duplicate SKU check
    const skuKey = sku.toUpperCase();
    if (seenSkus.has(skuKey)) {
      warnings.push(`${lineRef} (${name}): Mã hàng trùng "${sku}" — dòng thứ hai bị bỏ qua, không ghi đè.`);
      return;
    }
    seenSkus.add(skuKey);

    rows.push({ name, sku, baseUnit, retailUnit, unitsPerBase, wholesalePrice, retailPrice });
  });

  return { rows, warnings };
}

