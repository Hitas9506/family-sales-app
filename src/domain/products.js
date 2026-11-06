import { validateProduct } from './validation.js';

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filterProducts(products, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return products;
  return products.filter((product) => [product.name, product.sku].some((field) => normalizeText(field).includes(normalizedQuery)));
}

export function createProduct(input) {
  const result = validateProduct(input);
  if (!result.valid) throw new Error(result.errors.join('; '));
  return { ...input, id: input.id ?? crypto.randomUUID(), wholesalePrice: Number(input.wholesalePrice ?? 0), retailPrice: Number(input.retailPrice ?? 0) };
}

export function resolveSalePrice(product, unitType, quantity) {
  if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) throw new Error('Số lượng phải lớn hơn 0');
  const unitPrice = unitType === 'base' ? product.wholesalePrice : product.retailPrice;
  if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('Giá bán không hợp lệ');
  return unitPrice;
}
