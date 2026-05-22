/** IELTS band display — always one decimal place (e.g. 6 → "6.0", 7.5 → "7.5"). */
export function formatBandScore(value: number | string): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toFixed(1);
}
