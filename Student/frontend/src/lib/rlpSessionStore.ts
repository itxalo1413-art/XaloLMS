import type { Attendance, HomeworkStatus, RlpSession } from "@/lib/courseSchedule";
import {
  DEFAULT_COURSE_RLP_SESSIONS,
  setActiveRlpSessions,
} from "@/lib/courseSchedule";
import {
  canUseRlpSessionApi,
  fetchRlpSessionsForStudent,
  fetchRlpSessionsForTeacher,
  updateRlpSessionApi,
  type UpdateRlpSessionPayload,
} from "@/lib/rlpSessionApi";

export const RLP_SESSIONS_STORAGE_KEY = "xalo.course.rlpSessions.v2";
export const RLP_SESSIONS_UPDATE_EVENT = "xalo-rlp-sessions-updated";

let sessionsCache: RlpSession[] = [...DEFAULT_COURSE_RLP_SESSIONS];

function dispatchRlpUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RLP_SESSIONS_UPDATE_EVENT));
}

function normalizeSession(session: RlpSession): RlpSession {
  return {
    ...session,
    lessonFileUrl: session.lessonFileUrl?.trim() ?? "",
  };
}

function parse(raw: string | null): RlpSession[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as RlpSession[];
    return Array.isArray(data) ? data.map(normalizeSession) : [];
  } catch {
    return [];
  }
}

function loadLocal(): RlpSession[] {
  if (typeof window === "undefined") return [...DEFAULT_COURSE_RLP_SESSIONS];
  const raw = localStorage.getItem(RLP_SESSIONS_STORAGE_KEY);
  const stored = parse(raw);
  return stored.length > 0 ? stored : [...DEFAULT_COURSE_RLP_SESSIONS];
}

function saveLocal(rows: RlpSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RLP_SESSIONS_STORAGE_KEY, JSON.stringify(rows));
  sessionsCache = rows;
  dispatchRlpUpdate();
}

export function applyRlpSessionsCache(rows: RlpSession[]) {
  sessionsCache = rows.length > 0 ? rows : [...DEFAULT_COURSE_RLP_SESSIONS];
  setActiveRlpSessions(sessionsCache);
}

export function getCourseRlpSessions(): RlpSession[] {
  if (sessionsCache.length === 0) {
    sessionsCache = loadLocal();
  }
  return sessionsCache;
}

export async function refreshRlpSessions(): Promise<RlpSession[]> {
  if (canUseRlpSessionApi()) {
    for (const fetcher of [fetchRlpSessionsForTeacher, fetchRlpSessionsForStudent]) {
      try {
        const rows = await fetcher();
        saveLocal(rows);
        return rows;
      } catch {
        // try next endpoint
      }
    }
  }
  const local = loadLocal();
  applyRlpSessionsCache(local);
  dispatchRlpUpdate();
  return local;
}

export async function updateRlpSession(
  no: number,
  payload: UpdateRlpSessionPayload,
): Promise<RlpSession> {
  if (canUseRlpSessionApi()) {
    const remote = await updateRlpSessionApi(no, payload);
    const next = getCourseRlpSessions().map((s) => (s.no === no ? remote : s));
    saveLocal(next);
    return remote;
  }

  let updated: RlpSession | null = null;
  const next = getCourseRlpSessions().map((s) => {
    if (s.no !== no) return s;
    updated = {
      ...s,
      ...(payload.attendance !== undefined ? { attendance: payload.attendance } : {}),
      ...(payload.homeworkStatus !== undefined
        ? { homeworkStatus: payload.homeworkStatus }
        : {}),
      ...(payload.teacherNote !== undefined ? { teacherNote: payload.teacherNote } : {}),
      ...(payload.lessonFileUrl !== undefined
        ? { lessonFileUrl: payload.lessonFileUrl.trim() }
        : {}),
    };
    return updated;
  });
  if (!updated) throw new Error("Không tìm thấy buổi RLP");
  saveLocal(next);
  return updated;
}

export type { Attendance, HomeworkStatus };

if (typeof window !== "undefined") {
  applyRlpSessionsCache(loadLocal());
}
