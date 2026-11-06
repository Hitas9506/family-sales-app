import { describe, it, expect } from 'vitest';
import { summarizeRevenue, summarizeDebt } from '../../src/domain/reports.js';

const makeInvoice = (id, amount, paid, date) => ({ id, amount, paid, date: new Date(date) });

describe('summarizeRevenue', () => {
  const invoices = [
    makeInvoice('i1', 1000000, 1000000, '2026-11-01'),
    makeInvoice('i2', 2000000, 500000,  '2026-11-03'),
    makeInvoice('i3', 800000,  800000,  '2026-10-28'), // outside range
  ];

  it('sums gross sales within date range', () => {
    const range = { from: new Date('2026-11-01'), to: new Date('2026-11-30') };
    const { gross } = summarizeRevenue(invoices, range);
    expect(gross).toBe(3000000);
  });

  it('sums collected payments within range', () => {
    const range = { from: new Date('2026-11-01'), to: new Date('2026-11-30') };
    const { collected } = summarizeRevenue(invoices, range);
    expect(collected).toBe(1500000);
  });

  it('excludes invoices outside date range', () => {
    const range = { from: new Date('2026-11-01'), to: new Date('2026-11-30') };
    const { gross } = summarizeRevenue(invoices, range);
    expect(gross).toBe(3000000); // i3 excluded
  });

  it('handles empty invoice list', () => {
    const range = { from: new Date('2026-11-01'), to: new Date('2026-11-30') };
    const result = summarizeRevenue([], range);
    expect(result.gross).toBe(0);
    expect(result.collected).toBe(0);
    expect(result.outstanding).toBe(0);
  });
});

describe('summarizeDebt', () => {
  const invoices = [
    makeInvoice('i1', 2000000, 500000,  '2026-11-01'),
    makeInvoice('i2', 1500000, 1500000, '2026-11-02'),
    makeInvoice('i3', 800000,  0,        '2026-10-25'), // older unpaid
  ];

  it('calculates total outstanding across all invoices', () => {
    const { totalOutstanding } = summarizeDebt(invoices);
    expect(totalOutstanding).toBe(2300000); // (2000000-500000) + 800000
  });

  it('identifies overdue invoices (older than 7 days from reference)', () => {
    const ref = new Date('2026-11-04');
    const { overdueInvoices } = summarizeDebt(invoices, ref);
    expect(overdueInvoices.some(i => i.id === 'i3')).toBe(true);
    expect(overdueInvoices.some(i => i.id === 'i1')).toBe(false);
  });
});

