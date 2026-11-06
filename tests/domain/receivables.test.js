import { describe, expect, it } from 'vitest';
import { allocatePaymentOldestFirst, paySpecificInvoice } from '../../src/domain/receivables.js';

describe('receivables', () => {
  const invoices = [
    { id: 'old', issuedAt: '2026-11-01', outstanding: 300000 },
    { id: 'new', issuedAt: '2026-11-03', outstanding: 500000 },
  ];
  it('allocates settlement to oldest invoice first', () => {
    expect(allocatePaymentOldestFirst(invoices, 600000)).toEqual([
      { invoiceId: 'old', amount: 300000 },
      { invoiceId: 'new', amount: 300000 },
    ]);
  });
  it('supports partial payment for a specific invoice', () => {
    expect(paySpecificInvoice(invoices[1], 200000)).toEqual([{ invoiceId: 'new', amount: 200000 }]);
  });
});
