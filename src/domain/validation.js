const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export function validateQuantity(value) {
  return positive(value) ? { valid: true, errors: [] } : { valid: false, error: 'Số lượng phải lớn hơn 0' };
}

export function validateConversion(value) {
  return positive(value) ? { valid: true, errors: [] } : { valid: false, error: 'Quy đổi phải lớn hơn 0' };
}

export function validateProduct(input = {}) {
  const errors = [];
  if (!String(input.name ?? '').trim()) errors.push('Tên sản phẩm là bắt buộc');
  if (!String(input.baseUnit ?? '').trim()) errors.push('Đơn vị gốc là bắt buộc');
  if (!String(input.retailUnit ?? '').trim()) errors.push('Đơn vị lẻ là bắt buộc');
  if (!validateConversion(input.unitsPerBase).valid) errors.push('Quy đổi phải lớn hơn 0');
  return { valid: errors.length === 0, errors };
}
