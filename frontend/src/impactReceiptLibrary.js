export const RECEIPTS_PER_PAGE = 6;

export function isReceiptVerified(receipt) {
  return Boolean(
    receipt?.confirmations?.some((confirmation) => confirmation?.status === "confirmed"),
  );
}

function receiptTimestamp(receipt) {
  const value = receipt?.created_at || receipt?.updated_at || "";
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function sortImpactReceiptsVerifiedFirst(receipts = []) {
  return [...receipts].sort((left, right) => {
    const verifiedDifference = Number(isReceiptVerified(right)) - Number(isReceiptVerified(left));
    if (verifiedDifference !== 0) return verifiedDifference;

    const dateDifference = receiptTimestamp(right) - receiptTimestamp(left);
    if (dateDifference !== 0) return dateDifference;

    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });
}

export function getImpactReceiptPage(receipts = [], page = 1, pageSize = RECEIPTS_PER_PAGE) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || RECEIPTS_PER_PAGE);
  const start = (safePage - 1) * safePageSize;
  return receipts.slice(start, start + safePageSize);
}

export function getImpactReceiptPageNumbers(page, pageCount, windowSize = 5) {
  const safePageCount = Math.max(1, Number(pageCount) || 1);
  const safeWindow = Math.max(1, Math.min(Number(windowSize) || 5, safePageCount));
  const safePage = Math.min(Math.max(1, Number(page) || 1), safePageCount);
  const halfWindow = Math.floor(safeWindow / 2);
  let start = Math.max(1, safePage - halfWindow);
  let end = Math.min(safePageCount, start + safeWindow - 1);
  start = Math.max(1, end - safeWindow + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
