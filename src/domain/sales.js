import { resolveSalePrice } from './products.js';

export function buildOrderLine(product, unitType, quantity, priceOverride) {
  const price = priceOverride ?? resolveSalePrice(product, unitType, quantity);
  return { productId: product.id, unitType, quantity: Number(quantity), unitPrice: Number(price), total: Number(quantity) * Number(price) };
}

export function confirmOrder(order, inventoryState) {
  if (order.status && order.status !== 'draft') return order.confirmedResult;
  const lines = order.lines ?? [];
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  return { invoice: { ...order, status: 'confirmed', total, outstanding: total }, inventoryMovements: lines.map((line) => ({ productId: line.productId, unitType: line.unitType, quantity: line.quantity })), inventoryState };
}

export function applyInvoicePayment(invoice, payment) {
  if (payment.amount <= 0 || payment.amount > invoice.outstanding) throw new Error('Số tiền thanh toán không hợp lệ');
  const outstanding = invoice.outstanding - payment.amount;
  return { ...invoice, outstanding, status: outstanding === 0 ? 'paid' : 'partial' };
}
