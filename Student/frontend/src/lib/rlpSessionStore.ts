import type { Attendance, HomeworkStatus, RlpSession } from "@/lib/courseSchedule";
import {
  DEFAULT_COURSE_RLP_SESSIONS,
  setActiveRlpSessions,
} from "@/lib/courseSchedule";
import {
  canUseRlpSessionApi,
  canUseStudentRlpApi,
  canUseTeacherRlpApi,
  fetchRlpSessionsForStudent,
  fetchRlpSessionsForTeacher,
  addRlpSessionApi,
  deleteRlpSessionApi,
  updateRlpSessionApi,
  updateStudentHomeworkApi,
  type CreateRlpSessionPayload,
  type UpdateRlpSessionPayload,
} from "@/lib/rlpSessionApi";

export const RLP_SESSIONS_STORAGE_KEY = "xalo.course.rlpSessions.v2";
export const RLP_SESSIONS_UPDATE_EVENT = "xalo-rlp-sessions-updated";

let sessionsCache: RlpSession[] = [];

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
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RLP_SESSIONS_STORAGE_KEY);
  const stored = parse(raw);
  // Chỉ dùng seed DEFAULT khi chưa đăng nhập / không có API.
  if (stored.length > 0) return stored;
  if (!canUseRlpSessionApi()) return [...DEFAULT_COURSE_RLP_SESSIONS];
  return [];
}

function saveLocal(rows: RlpSession[], silent = false) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RLP_SESSIONS_STORAGE_KEY, JSON.stringify(rows));
  sessionsCache = rows;
  setActiveRlpSessions(rows);
  if (!silent) {
    dispatchRlpUpdate();
  }
}

function saveCache(rows: RlpSession[]) {
  sessionsCache = rows;
  setActiveRlpSessions(sessionsCache);
  dispatchRlpUpdate();
}

export function applyRlpSessionsCache(rows: RlpSession[]) {
  sessionsCache = rows;
  setActiveRlpSessions(sessionsCache);
}

export function getCourseRlpSessions(): RlpSession[] {
  if (sessionsCache.length === 0 && !canUseRlpSessionApi()) {
    sessionsCache = loadLocal();
  }
  return sessionsCache;
}

function fallbackRlpSessions(): RlpSession[] {
  // Đã login: giữ cache hiện tại / rỗng — không đổ lịch RLP giả.
  if (canUseRlpSessionApi()) {
    return sessionsCache;
  }
  if (sessionsCache.length > 0) return sessionsCache;
  const local = loadLocal();
  applyRlpSessionsCache(local);
  return local;
}

export async function refreshRlpSessions(classId?: string): Promise<RlpSession[]> {
  if (canUseRlpSessionApi()) {
    try {
      const rows = canUseTeacherRlpApi()
        ? await fetchRlpSessionsForTeacher(classId)
        : await fetchRlpSessionsForStudent();
      applyRlpSessionsCache(rows);
      return rows;
    } catch (err) {
      console.warn("Could not refresh RLP sessions from API", err);
      return fallbackRlpSessions();
    }
  }
  const local = loadLocal();
  applyRlpSessionsCache(local);
  return local;
}

export async function updateRlpSession(
  no: number,
  payload: UpdateRlpSessionPayload,
  classId?: string,
): Promise<RlpSession> {
  if (canUseTeacherRlpApi()) {
    const remote = await updateRlpSessionApi(no, payload, classId);
    const next = getCourseRlpSessions().map((s) => (s.no === no ? remote : s));
    if (canUseRlpSessionApi()) {
      saveCache(next);
    } else {
      saveLocal(next);
    }
    return remote;
  }

  if (canUseStudentRlpApi() && payload.homeworkStatus) {
    const remote = await updateStudentHomeworkApi(
      no,
      payload.homeworkStatus,
      payload.homeworkFileUrl,
    );
    const next = getCourseRlpSessions().map((s) => (s.no === no ? remote : s));
    saveCache(next);
    return remote;
  }

  let updated: RlpSession | null = null;
  const next = getCourseRlpSessions().map((s) => {
    if (s.no !== no) return s;
    updated = {
      ...s,
      ...(payload.attendance !== undefined ? { attendance: payload.attendance } : {}),
      ...(payload.studentAttendance !== undefined
        ? { studentAttendance: { ...(s.studentAttendance ?? {}), ...payload.studentAttendance } }
        : {}),
      ...(payload.studentHomework !== undefined
        ? { studentHomework: { ...(s.studentHomework ?? {}), ...payload.studentHomework } }
        : {}),
      ...(payload.homeworkStatus !== undefined
        ? { homeworkStatus: payload.homeworkStatus }
        : {}),
      ...(payload.teacherNote !== undefined ? { teacherNote: payload.teacherNote } : {}),
      ...(payload.lessonFileUrl !== undefined
        ? { lessonFileUrl: payload.lessonFileUrl.trim() }
        : {}),
      ...(payload.homeworkFileUrl !== undefined
        ? { homeworkFileUrl: payload.homeworkFileUrl.trim() }
        : {}),
      ...(payload.recordingUrl !== undefined
        ? { recordingUrl: payload.recordingUrl.trim() }
        : {}),
      ...(payload.contents !== undefined ? { contents: payload.contents.trim() } : {}),
      ...(payload.date !== undefined ? { date: payload.date.trim() } : {}),
      ...(payload.deadline !== undefined ? { deadline: payload.deadline.trim() } : {}),
      ...(payload.skill !== undefined ? { skill: payload.skill.trim() } : {}),
    };
    return updated;
  });
  if (!updated) throw new Error("Không tìm thấy buổi RLP");
  saveLocal(next);
  return updated;
}

export async function addRlpSession(
  classId: string,
  payload: CreateRlpSessionPayload = {},
): Promise<RlpSession> {
  if (!canUseTeacherRlpApi()) {
    throw new Error("Chỉ giáo viên / học vụ mới thêm được buổi RLP");
  }
  const remote = await addRlpSessionApi(classId, payload);
  const next = [...getCourseRlpSessions().filter((s) => s.no !== remote.no), remote].sort(
    (a, b) => a.no - b.no,
  );
  saveCache(next);
  return remote;
}

export async function deleteRlpSession(no: number, classId: string): Promise<void> {
  if (!canUseTeacherRlpApi()) {
    throw new Error("Chỉ giáo viên / học vụ mới xóa được buổi RLP");
  }
  await deleteRlpSessionApi(no, classId);
  saveCache(getCourseRlpSessions().filter((s) => s.no !== no));
}

export type { Attendance, HomeworkStatus };

if (typeof window !== "undefined" && !canUseRlpSessionApi()) {
  applyRlpSessionsCache(loadLocal());
}
