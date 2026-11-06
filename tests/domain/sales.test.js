import { describe, expect, it } from 'vitest';
import { applyInvoicePayment, buildOrderLine, confirmOrder } from '../../src/domain/sales.js';

const product = { id: 'pipe-21', wholesalePrice: 120000, retailPrice: 35000 };

describe('sales domain', () => {
  it('builds whole and retail lines with correct prices', () => {
    expect(buildOrderLine(product, 'base', 2)).toMatchObject({ unitPrice: 120000, total: 240000 });
    expect(buildOrderLine(product, 'retail', 1.5)).toMatchObject({ unitPrice: 35000, total: 52500 });
  });

  it('confirms draft order with total and outstanding balance', () => {
    const result = confirmOrder({ status: 'draft', lines: [buildOrderLine(product, 'base', 1)] }, {});
    expect(result.invoice).toMatchObject({ status: 'confirmed', total: 120000, outstanding: 120000 });
  });

  it('moves invoice to partial then paid state', () => {
    const invoice = { total: 120000, outstanding: 120000, status: 'confirmed' };
    const partial = applyInvoicePayment(invoice, { amount: 50000 });
    expect(partial).toMatchObject({ outstanding: 70000, status: 'partial' });
    expect(applyInvoicePayment(partial, { amount: 70000 })).toMatchObject({ outstanding: 0, status: 'paid' });
  });
});
