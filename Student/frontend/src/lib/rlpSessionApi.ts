import { parseApiJson } from "@/lib/apiBase";
import { apiFetch, getAuthToken, getCachedAuthUser, isAuthDisabled, type AuthRole } from "@/lib/auth";
import type { RlpSession } from "@/lib/courseSchedule";

function rlpApiRole(): AuthRole | null {
  if (isAuthDisabled() || !getAuthToken()) return null;
  return getCachedAuthUser()?.role ?? null;
}

export function canUseTeacherRlpApi(): boolean {
  const role = rlpApiRole();
  return role === "GV" || role === "ACA";
}

export function canUseStudentRlpApi(): boolean {
  return rlpApiRole() === "HS";
}

export function canUseRlpSessionApi(): boolean {
  const role = rlpApiRole();
  return role === "GV" || role === "HS" || role === "ACA";
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    let message = `RLP API failed (${response.status})`;
    try {
      const body = await parseApiJson<{ message?: string | string[] }>(response);
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("API lỗi")) {
        message = err.message;
      }
    }
    throw new Error(message);
  }
  return parseApiJson<T>(response);
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
  studentAttendance?: RlpSession["studentAttendance"];
  homeworkStatus?: RlpSession["homeworkStatus"];
  teacherNote?: string;
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  recordingUrl?: string;
  contents?: string;
  date?: string;
  deadline?: string;
  skill?: string;
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
