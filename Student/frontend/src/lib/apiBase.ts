/**
 * Same-origin `/api/*` — proxied to NestJS via `next.config.ts` rewrites.
 * Avoids CORS issues and prevents accidental fetches to the Next.js HTML shell.
 */
export const API_BASE = "";

export async function parseApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const hint = text.trimStart().startsWith("<!")
      ? "Nhận HTML thay vì JSON — kiểm tra backend đang chạy và NEXT_PUBLIC_BACKEND_URL."
      : text.slice(0, 120);
    throw new Error(`API lỗi (${response.status}): ${hint}`);
  }
  return response.json() as Promise<T>;
}
