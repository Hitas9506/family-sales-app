function validatePayment(amount, max = Infinity) {
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > max) throw new Error('Số tiền thanh toán không hợp lệ');
}

export function paySpecificInvoice(invoice, amount) {
  validatePayment(amount, Number(invoice.outstanding));
  return [{ invoiceId: invoice.id, amount: Number(amount) }];
}

export function allocatePaymentOldestFirst(invoices, amount) {
  validatePayment(amount, invoices.reduce((sum, invoice) => sum + Number(invoice.outstanding), 0));
  let remaining = Number(amount);
  return [...invoices]
    .filter((invoice) => Number(invoice.outstanding) > 0)
    .sort((a, b) => new Date(a.issuedAt) - new Date(b.issuedAt))
    .flatMap((invoice) => {
      const applied = Math.min(remaining, Number(invoice.outstanding));
      remaining -= applied;
      return applied > 0 ? [{ invoiceId: invoice.id, amount: applied }] : [];
    });
}
