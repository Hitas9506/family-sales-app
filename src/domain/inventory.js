function ensurePositive(value, label) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) throw new Error(`${label} phải lớn hơn 0`);
}

function clone(state) {
  return { wholeUnits: Number(state.wholeUnits), leftoverUnits: Number(state.leftoverUnits), unitsPerBase: Number(state.unitsPerBase) };
}

export function receiveStock(state, { baseQuantity, unitsPerBase = state.unitsPerBase }) {
  ensurePositive(baseQuantity, 'Số lượng');
  ensurePositive(unitsPerBase, 'Quy đổi');
  const next = clone(state);
  next.unitsPerBase = Number(unitsPerBase);
  next.wholeUnits += Number(baseQuantity);
  return next;
}

export function sellBaseUnits(state, quantity) {
  ensurePositive(quantity, 'Số lượng');
  const next = clone(state);
  if (Number(quantity) > next.wholeUnits) throw new Error('Tồn kho không đủ');
  next.wholeUnits -= Number(quantity);
  return next;
}

export function getAvailableRetailQuantity(state) {
  return state.wholeUnits * state.unitsPerBase + state.leftoverUnits;
}

export function sellRetailUnits(state, quantity) {
  ensurePositive(quantity, 'Số lượng');
  const next = clone(state);
  if (Number(quantity) > getAvailableRetailQuantity(next)) throw new Error('Tồn kho không đủ');
  let remaining = Number(quantity);
  const fromLeftover = Math.min(next.leftoverUnits, remaining);
  next.leftoverUnits -= fromLeftover;
  remaining -= fromLeftover;
  if (remaining > 0) {
    const opened = Math.ceil(remaining / next.unitsPerBase);
    next.wholeUnits -= opened;
    next.leftoverUnits += opened * next.unitsPerBase - remaining;
  }
  return next;
}

export function getDisplayStock(state) {
  return { wholeUnits: state.wholeUnits, leftoverUnits: state.leftoverUnits };
}
