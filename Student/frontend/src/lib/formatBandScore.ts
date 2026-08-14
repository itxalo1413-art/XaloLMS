/** IELTS band display — always one decimal place for integer bands (e.g. 6 → "6.0", 7.5 → "7.5"). */
export function formatBandScore(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string" && value.trim() === "-") return "—";
  const n = typeof value === "string" ? Number.parseFloat(value.replace(",", ".")) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toFixed(1);
}
