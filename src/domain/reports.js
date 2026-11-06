/**
 * Pure report aggregation functions.
 * All functions are stateless and work on plain data arrays.
 */

/**
 * Summarise revenue metrics for invoices within a date range.
 * @param {Array<{id,amount,paid,date:Date}>} invoices
 * @param {{from:Date,to:Date}} range  inclusive on both ends
 * @returns {{ gross:number, collected:number, outstanding:number, invoiceCount:number }}
 */
export function summarizeRevenue(invoices, range) {
  const inRange = invoices.filter(inv => inv.date >= range.from && inv.date <= range.to);
  const gross = inRange.reduce((s, inv) => s + inv.amount, 0);
  const collected = inRange.reduce((s, inv) => s + (inv.paid ?? 0), 0);
  return { gross, collected, outstanding: gross - collected, invoiceCount: inRange.length };
}

/**
 * Summarise outstanding debt across all invoices (no date filter).
 * @param {Array<{id,amount,paid,date:Date}>} invoices
 * @param {Date} [referenceDate]  defaults to now; invoices older than 7 days are "overdue"
 * @returns {{ totalOutstanding:number, overdueInvoices: Array }}
 */
export function summarizeDebt(invoices, referenceDate) {
  const ref = referenceDate ?? new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const unpaid = invoices.filter(inv => (inv.paid ?? 0) < inv.amount);
  const totalOutstanding = unpaid.reduce((s, inv) => s + (inv.amount - (inv.paid ?? 0)), 0);
  const overdueInvoices = unpaid.filter(inv => ref - inv.date > sevenDaysMs);
  return { totalOutstanding, overdueInvoices };
}

/**
 * Summarise inventory value and low-stock products.
 * @param {Array<{id,name,wholesalePrice,unitsPerBase,stock:{whole,leftover}}>} products
 * @param {number} [lowStockThreshold=3]
 * @returns {{ totalValue:number, lowStockProducts:Array, productCount:number }}
 */
export function summarizeInventory(products, lowStockThreshold = 3) {
  let totalValue = 0;
  for (const p of products) {
    const wholeValue = p.stock.whole * p.wholesalePrice;
    const leftoverValue = (p.stock.leftover / p.unitsPerBase) * p.wholesalePrice;
    totalValue += wholeValue + leftoverValue;
  }
  const lowStockProducts = products.filter(p => p.stock.whole <= lowStockThreshold);
  return { totalValue, lowStockProducts, productCount: products.length };
}

