export function createReceiptDraft(win, result) {
  const accomplishment = String(win || '').trim();
  const outcome = String(result || '').trim();

  if (!accomplishment) return null;

  return {
    win: accomplishment,
    result: outcome,
    resultDisplay: outcome || 'Result not added yet — BragStack will not invent one.',
    visibility: 'private',
  };
}
