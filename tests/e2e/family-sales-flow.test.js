/**
 * E2E domain flow test — exercises the complete lifecycle:
 * receive stock → sell → create debt invoice → partial payment → oldest-first settlement
 * No browser or network required; pure domain logic only.
 */
import { describe, it, expect } from 'vitest';
import { receiveStock, sellBaseUnits, sellRetailUnits, getAvailableRetailQuantity } from '../../src/domain/inventory.js';
import { buildOrderLine } from '../../src/domain/sales.js';
import { allocatePaymentOldestFirst, paySpecificInvoice } from '../../src/domain/receivables.js';
import { parseProductRows } from '../../src/import/excel-parser.js';
import { summarizeRevenue, summarizeDebt, summarizeInventory } from '../../src/domain/reports.js';

const BASE_STATE  = { wholeUnits: 0, leftoverUnits: 0, unitsPerBase: 4 };
const BASE_PRODUCT = {
  id: 'pipe-21', sku: 'ONG-21', name: 'Ống nước PVC phi 21',
  baseUnit: 'cây', retailUnit: 'mét', unitsPerBase: 4,
  wholesalePrice: 120000, retailPrice: 35000,
};

describe('Full lifecycle — inventory, sales, receivables, reports', () => {
  it('receive 10 trees × 4 meters = 40 meters total available', () => {
    const state = receiveStock(BASE_STATE, { baseQuantity: 10, unitsPerBase: 4 });
    expect(state.wholeUnits).toBe(10);
    expect(getAvailableRetailQuantity(state)).toBe(40);
  });

  it('sell 1 tree (base unit) reduces wholeUnits by 1', () => {
    const state0 = receiveStock(BASE_STATE, { baseQuantity: 10, unitsPerBase: 4 });
    const state1 = sellBaseUnits(state0, 1);
    expect(state1.wholeUnits).toBe(9);
  });

  it('sell 1.5 meters (retail), leftover fills from opened whole unit', () => {
    const state0 = { wholeUnits: 9, leftoverUnits: 0, unitsPerBase: 4 };
    const state1 = sellRetailUnits(state0, 1.5);
    // 4m from opened unit, sold 1.5m → leftover = 2.5m
    expect(state1.leftoverUnits).toBeCloseTo(2.5, 5);
    expect(state1.wholeUnits).toBe(8); // one whole opened
  });

  it('buildOrderLine calculates correct total for base unit sale', () => {
    const line = buildOrderLine(BASE_PRODUCT, 'base', 2);
    expect(line.unitPrice).toBe(120000);
    expect(line.total).toBe(240000);
  });

  it('buildOrderLine calculates correct total for retail unit sale', () => {
    const line = buildOrderLine(BASE_PRODUCT, 'retail', 3.5);
    expect(line.unitPrice).toBe(35000);
    expect(line.total).toBe(122500);
  });

  it('oldest-first allocation: pays oldest invoice first', () => {
    const invoices = [
      { id: 'inv-old', outstanding: 500000, date: new Date('2026-10-01'), issuedAt: '2026-10-01' },
      { id: 'inv-new', outstanding: 800000, date: new Date('2026-11-01'), issuedAt: '2026-11-01' },
    ];
    const result = allocatePaymentOldestFirst(invoices, 600000);
    const oldAlloc = result.find(r => r.invoiceId === 'inv-old');
    const newAlloc = result.find(r => r.invoiceId === 'inv-new');
    expect(oldAlloc.amount).toBe(500000);
    expect(newAlloc.amount).toBe(100000);
  });

  it('paySpecificInvoice allows partial payment on a specific invoice', () => {
    const invoice = { id: 'inv-1', outstanding: 1500000, date: new Date() };
    const result = paySpecificInvoice(invoice, 300000);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(300000);
    expect(result[0].invoiceId).toBe('inv-1');
  });

  it('Excel import of valid rows produces correct product records', () => {
    const rows = [{
      'Tên sản phẩm': 'Dây điện Cadivi', 'Mã hàng': 'DAY-25',
      'Đơn vị nguyên': 'cuộn', 'Đơn vị lẻ': 'mét',
      'Quy đổi (1 nguyên = ? lẻ)': 100, 'Giá sỉ (đồng)': 850000, 'Giá lẻ (đồng)': 9500,
    }];
    const { rows: parsed, warnings } = parseProductRows(rows);
    expect(parsed).toHaveLength(1);
    expect(warnings).toHaveLength(0);
    expect(parsed[0].unitsPerBase).toBe(100);
  });

  it('summarizeRevenue totals gross and collected within range', () => {
    const invoices = [
      { id: 'i1', amount: 1000000, paid: 1000000, date: new Date('2026-11-01') },
      { id: 'i2', amount: 2000000, paid: 500000,  date: new Date('2026-11-03') },
    ];
    const range = { from: new Date('2026-11-01'), to: new Date('2026-11-30') };
    const { gross, collected, outstanding } = summarizeRevenue(invoices, range);
    expect(gross).toBe(3000000);
    expect(collected).toBe(1500000);
    expect(outstanding).toBe(1500000);
  });

  it('summarizeInventory calculates total value correctly', () => {
    const products = [{
      ...BASE_PRODUCT,
      stock: { whole: 8, leftover: 2.5 },
    }];
    const { totalValue } = summarizeInventory(products);
    // 8 cây × 120000 + (2.5/4) cuộn × 120000
    expect(totalValue).toBeCloseTo(8 * 120000 + (2.5 / 4) * 120000, 0);
  });
});
