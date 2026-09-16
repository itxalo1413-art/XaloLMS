/** IELTS band display — one decimal; ranges like "5.5-6.0" keep both ends. */
export function formatBandScore(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string" && value.trim() === "-") return "—";
  if (typeof value === "string") {
    const raw = value.trim().replace(",", ".");
    const range = raw.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/);
    if (range) {
      const a = Number.parseFloat(range[1]);
      const b = Number.parseFloat(range[2]);
      if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
        return `${a.toFixed(1)}-${b.toFixed(1)}`;
      }
    }
  }
  const n = typeof value === "string" ? Number.parseFloat(value.replace(",", ".")) : value;
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toFixed(1);
}
