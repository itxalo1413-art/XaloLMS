/**
 * Practice Class RLP API — Frontend client
 * Endpoints:
 *   Teacher/ACA: GET/POST/PATCH/DELETE /api/teacher/practice-rlp?studentId=xxx
 *   Student:     GET /api/student/practice-rlp
 */
import { parseApiJson } from "@/lib/apiBase";
import {
  apiFetch,
  getAuthToken,
  getCachedAuthUser,
  isAuthDisabled,
  type AuthUser,
} from "@/lib/auth";
import type { RlpSession, Attendance, HomeworkStatus } from "@/lib/courseSchedule";

// ── Auth helpers ──────────────────────────────────────────────────────────────

function practiceRlpApiRole(): string | null {
  if (isAuthDisabled() || !getAuthToken()) return null;
  return getCachedAuthUser()?.role ?? null;
}

export function canUsePracticeRlpApi(): boolean {
  const role = practiceRlpApiRole();
  return role === "GV" || role === "HS" || role === "ACA";
}

export function canEditPracticeClassRlp(user?: AuthUser | null): boolean {
  const u = user ?? getCachedAuthUser();
  if (!u) return false;
  const nameLower = u.name.toLowerCase();
  const emailLower = u.email.toLowerCase();
  // Strict: only Giáo viên Thanh Tâm (GV role) and Học vụ Khánh Thi (ACA role)
  if (u.role === "GV") {
    return nameLower.includes("thanh tâm") || emailLower.includes("thanhtam");
  }
  if (u.role === "ACA") {
    return (
      nameLower.includes("khánh thi") ||
      nameLower.includes("khanh thi") ||
      emailLower.includes("khanhthi")
    );
  }
  return false;
}

/**
 * Students (HS) can view their own Practice RLP.
 * Teachers/ACA can only view if they are Thanh Tâm or Khánh Thi.
 */
export function canViewPracticeClassRlp(user?: AuthUser | null): boolean {
  const u = user ?? getCachedAuthUser();
  if (!u) return false;
  // Students always see their own RLP
  if (u.role === "HS") return true;
  // Teacher/ACA: only Thanh Tâm & Khánh Thi
  return canEditPracticeClassRlp(u);
}

// ── JSON helpers ──────────────────────────────────────────────────────────────

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) {
    let message = `Practice RLP API failed (${response.status})`;
    try {
      const body = await parseApiJson<{ message?: string | string[] }>(response);
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return parseApiJson<T>(response);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type PracticeRlpSession = RlpSession;

export type CreatePracticeRlpPayload = {
  no?: number;
  date: string;
  skill: string;
  contents: string;
  teacherNote?: string;
  deadline?: string;
  homeworkStatus?: HomeworkStatus;
  attendance?: Attendance;
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  recordingUrl?: string;
};

export type UpdatePracticeRlpPayload = {
  attendance?: Attendance;
  homeworkStatus?: HomeworkStatus;
  teacherNote?: string;
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  recordingUrl?: string;
  contents?: string;
  date?: string;
  deadline?: string;
  skill?: string;
};

// ── API functions ─────────────────────────────────────────────────────────────

/** Teacher/ACA: Fetch Practice RLP sessions for a specific student */
export async function fetchPracticeRlpForTeacher(
  studentId: string,
): Promise<PracticeRlpSession[]> {
  const response = await apiFetch(
    `/api/teacher/practice-rlp?studentId=${encodeURIComponent(studentId)}`,
    { method: "GET" },
  );
  return parseJson(response);
}

/** Student: Fetch own Practice RLP sessions */
export async function fetchPracticeRlpForStudent(): Promise<PracticeRlpSession[]> {
  const response = await apiFetch("/api/student/practice-rlp", { method: "GET" });
  return parseJson(response);
}

/** Teacher/ACA: Add a new session to a student's Practice RLP */
export async function addPracticeRlpSession(
  studentId: string,
  payload: CreatePracticeRlpPayload,
): Promise<PracticeRlpSession> {
  const response = await apiFetch(
    `/api/teacher/practice-rlp?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return parseJson(response);
}

/** Teacher/ACA: Update an existing session in a student's Practice RLP */
export async function updatePracticeRlpSession(
  studentId: string,
  no: number,
  payload: UpdatePracticeRlpPayload,
): Promise<PracticeRlpSession> {
  const response = await apiFetch(
    `/api/teacher/practice-rlp/${no}?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  const data = await parseJson<{ session: PracticeRlpSession }>(response);
  return data.session;
}

/** Teacher/ACA: Delete a session from a student's Practice RLP */
export async function deletePracticeRlpSession(
  studentId: string,
  no: number,
): Promise<void> {
  const response = await apiFetch(
    `/api/teacher/practice-rlp/${no}?studentId=${encodeURIComponent(studentId)}`,
    { method: "DELETE" },
  );
  await parseJson(response);
}
