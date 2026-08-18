import { parseApiJson } from "@/lib/apiBase";
import { apiFetch } from "@/lib/auth";

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) {
    throw new Error(`Teacher attendance API failed (${response.status})`);
  }
  return parseApiJson<T>(response);
}

export async function fetchTeacherAttendance(): Promise<Record<string, boolean>> {
  const response = await apiFetch("/api/teacher/attendance", { method: "GET" });
  return parseJson<Record<string, boolean>>(response);
}

export async function toggleTeacherAttendance(
  sessionId: string,
  attended?: boolean,
): Promise<Record<string, boolean>> {
  const response = await apiFetch(`/api/teacher/attendance/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    body: JSON.stringify(attended === undefined ? {} : { attended }),
  });
  return parseJson<Record<string, boolean>>(response);
}
