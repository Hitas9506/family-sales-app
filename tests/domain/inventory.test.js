import { describe, expect, it } from 'vitest';
import { getAvailableRetailQuantity, getDisplayStock, receiveStock, sellBaseUnits, sellRetailUnits } from '../../src/domain/inventory.js';

const initial = { wholeUnits: 0, leftoverUnits: 0, unitsPerBase: 4 };

describe('inventory conversion', () => {
  it('receives base units and exposes retail quantity', () => {
    const state = receiveStock(initial, { baseQuantity: 10, unitsPerBase: 4 });
    expect(state).toMatchObject({ wholeUnits: 10, leftoverUnits: 0 });
    expect(getAvailableRetailQuantity(state)).toBe(40);
  });

  it('sells whole units without changing leftover units', () => {
    expect(sellBaseUnits({ wholeUnits: 10, leftoverUnits: 0, unitsPerBase: 4 }, 1)).toMatchObject({ wholeUnits: 9, leftoverUnits: 0 });
  });

  it('uses leftovers first and opens one base unit when needed', () => {
    const state = { wholeUnits: 2, leftoverUnits: 1, unitsPerBase: 4 };
    const sold = sellRetailUnits(state, 2.5);
    expect(sold).toMatchObject({ wholeUnits: 1, leftoverUnits: 2.5 });
    expect(getDisplayStock(sold)).toEqual({ wholeUnits: 1, leftoverUnits: 2.5 });
  });

  it('rejects insufficient stock', () => {
    expect(() => sellRetailUnits({ wholeUnits: 1, leftoverUnits: 0, unitsPerBase: 4 }, 4.1)).toThrow('Tồn kho không đủ');
  });
});
