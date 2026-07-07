import { apiFetch, getAuthToken, isAuthDisabled } from "@/lib/auth";
import type { RlpSession } from "@/lib/courseSchedule";

export function canUseRlpSessionApi(): boolean {
  return !isAuthDisabled() && Boolean(getAuthToken());
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    let message = `RLP API failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function fetchRlpSessionsForTeacher(classId?: string): Promise<RlpSession[]> {
  const url = classId ? `/api/teacher/rlp-sessions?classId=${encodeURIComponent(classId)}` : "/api/teacher/rlp-sessions";
  const response = await apiFetch(url, { method: "GET" });
  return parseJson(response);
}

export async function fetchRlpSessionsForStudent(): Promise<RlpSession[]> {
  const response = await apiFetch("/api/student/rlp-sessions", { method: "GET" });
  return parseJson(response);
}

export type UpdateRlpSessionPayload = {
  attendance?: RlpSession["attendance"];
  homeworkStatus?: RlpSession["homeworkStatus"];
  teacherNote?: string;
  lessonFileUrl?: string;
};

export async function updateRlpSessionApi(
  no: number,
  payload: UpdateRlpSessionPayload,
  classId?: string,
): Promise<RlpSession> {
  const url = classId
    ? `/api/teacher/rlp-sessions/${no}?classId=${encodeURIComponent(classId)}`
    : `/api/teacher/rlp-sessions/${no}`;
  const response = await apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ session: RlpSession }>(response);
  return data.session;
}
