"use client";

import {
  canUseAcaApi,
  createAcademicWarningApi,
  dismissAcademicWarningApi,
  fetchAcaAcademicWarningsApi,
  fetchStudentAcademicWarningsApi,
  fetchTeacherAcademicWarningsApi,
  notifyAcademicWarningApi,
  updateAcademicWarningApi,
} from "@/lib/acaManagementApi";
import { getAuthToken } from "@/lib/auth";

export type WarningType =
  | "absent_notice"
  | "absent_exceeded"
  | "homework_insufficient";
export type WarningRiskLevel = "warning" | "high" | "critical";
export type WarningHandledStatus = "pending" | "contacted" | "supplement_scheduled" | "resolved";

export interface AcademicWarningRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  classId: string;
  className: string;
  teacherName: string;
  courseDurationMonths: number; // usually 3 months
  checkpointPhase: string; // "Chặng 1 (1 nửa khóa học - 1.5 tháng)"
  totalSessionsElapsed: number; // e.g. 12 or 14 sessions
  absentCount: number; // e.g. 5 or 6
  attendanceRate: number; // percentage
  homeworkSubmitted: number; // e.g. 8
  homeworkTotal: number; // e.g. 12
  homeworkRate: number; // percentage (e.g. 66.7)
  warningTypes: WarningType[]; // ["absent_exceeded"] or ["homework_insufficient"] or both
  notificationSentToStudent: boolean;
  studentNotificationDismissed: boolean;
  riskLevel: WarningRiskLevel;
  handledStatus: WarningHandledStatus;
  handlingNote?: string;
  notificationMessage?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt?: string;
  /** Ngày khai giảng / bắt đầu học (dd/mm/yyyy) — dùng để xét đủ 1 chặng */
  classOpenDate?: string;
  /** true khi đã học đủ 1 chặng (≈ 8 buổi) */
  firstStageCompleted?: boolean;
}

/** Khóa 3 tháng = 2 chặng; 1 chặng = nửa khóa ≈ 1.5 tháng. */
export const COURSE_DURATION_MONTHS = 3;
export const FIRST_STAGE_MONTHS = 1.5;
export const FIRST_STAGE_DAYS = 46; // ~1.5 * 30.4
export const FIRST_STAGE_SESSIONS = 8; // 1 chặng = 8 buổi
export const FULL_COURSE_SESSIONS = 16; // 2 chặng = 16 buổi
/**
 * Ngưỡng cảnh báo BTVN: số deadline đã tới (≤ ngày hiện tại) mà học viên chưa hoàn thành.
 * Không còn dùng % nộp bài.
 */
export const HOMEWORK_UNFINISHED_WARNING_THRESHOLD = 4;
/** Vắng 3 buổi: hệ thống tự gửi noti cho học viên (không lên bảng học vụ). */
export const ABSENT_STUDENT_NOTI_THRESHOLD = 3;
/** Vắng từ 4 buổi: hiện trên bảng Cảnh báo học tập của học vụ. */
export const ABSENT_ACA_TABLE_THRESHOLD = 4;
/** @deprecated dùng ABSENT_ACA_TABLE_THRESHOLD */
export const ABSENT_WARNING_THRESHOLD = ABSENT_ACA_TABLE_THRESHOLD;

export function parseAcademicDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const raw = dateStr.trim();
  if (!raw || raw === "-") return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const vi = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vi) return new Date(Number(vi[3]), Number(vi[2]) - 1, Number(vi[1]));
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function hasCompletedFirstStage(input: {
  firstStageCompleted?: boolean;
  totalSessionsElapsed?: number;
  classOpenDate?: string;
  phaseStartDate?: string;
  nextPhaseStartDate?: string;
  phaseDurationDays?: number;
  now?: Date;
}): boolean {
  if (input.firstStageCompleted === true) return true;
  const now = input.now ?? new Date();
  now.setHours(0, 0, 0, 0);

  const nextPhase = parseAcademicDate(input.nextPhaseStartDate);
  if (nextPhase) {
    nextPhase.setHours(0, 0, 0, 0);
    if (now.getTime() >= nextPhase.getTime()) return true;
  }

  const start =
    parseAcademicDate(input.classOpenDate) || parseAcademicDate(input.phaseStartDate);
  const durationDays =
    input.phaseDurationDays && input.phaseDurationDays > 0
      ? input.phaseDurationDays
      : FIRST_STAGE_DAYS;
  if (start) {
    start.setHours(0, 0, 0, 0);
    const elapsedDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
    if (elapsedDays >= durationDays) return true;
  }

  const sessionsNeeded =
    input.phaseDurationDays && input.phaseDurationDays > 0
      ? Math.max(8, Math.round((input.phaseDurationDays / 7) * 2))
      : FIRST_STAGE_SESSIONS;
  if ((input.totalSessionsElapsed ?? 0) >= sessionsNeeded) return true;

  return false;
}

export function requiredFullCourseSessions(classCode?: string): number {
  const code = (classCode || "").toUpperCase();
  if (code.includes("FOU") || code.includes("FOUND")) return FIRST_STAGE_SESSIONS;
  return FULL_COURSE_SESSIONS;
}

/** Hoàn thành 1 khóa = học đủ 2 chặng (Foundation: 1 chặng). */
export function hasCompletedFullCourse(input: {
  totalSessionsElapsed?: number;
  classOpenDate?: string;
  phaseStartDate?: string;
  nextPhaseStartDate?: string;
  endDate?: string;
  phaseDurationDays?: number;
  requiredSessions?: number;
  now?: Date;
}): boolean {
  const requiredSessions = input.requiredSessions ?? FULL_COURSE_SESSIONS;
  const isFoundationCourse = requiredSessions <= FIRST_STAGE_SESSIONS;

  if (!isFoundationCourse && !hasCompletedFirstStage(input)) return false;

  const now = input.now ?? new Date();
  now.setHours(0, 0, 0, 0);

  const endDate = parseAcademicDate(input.endDate);
  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
    if (now.getTime() >= endDate.getTime()) return true;
  }

  const durationDays =
    input.phaseDurationDays && input.phaseDurationDays > 0
      ? input.phaseDurationDays
      : FIRST_STAGE_DAYS;

  if (isFoundationCourse) {
    return hasCompletedFirstStage(input);
  }

  const nextPhase = parseAcademicDate(input.nextPhaseStartDate);
  if (nextPhase) {
    nextPhase.setHours(0, 0, 0, 0);
    const phase2End = new Date(nextPhase);
    phase2End.setDate(phase2End.getDate() + durationDays);
    phase2End.setHours(0, 0, 0, 0);
    if (now.getTime() >= phase2End.getTime()) return true;
  }

  const start =
    parseAcademicDate(input.classOpenDate) || parseAcademicDate(input.phaseStartDate);
  if (start) {
    start.setHours(0, 0, 0, 0);
    const elapsedDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
    if (elapsedDays >= durationDays * 2) return true;
  }

  if ((input.totalSessionsElapsed ?? 0) >= requiredSessions) return true;

  return false;
}

export function shouldNotifyAbsentSoft(absentCount: number): boolean {
  return absentCount >= ABSENT_STUDENT_NOTI_THRESHOLD;
}

/** Hiện bảng học vụ khi vắng ≥ 4 (t4, t5, t6…). */
export function shouldWarnAbsent(absentCount: number): boolean {
  return absentCount >= ABSENT_ACA_TABLE_THRESHOLD;
}

export function unfinishedHomeworkCount(
  homeworkSubmitted: number,
  homeworkTotal: number,
): number {
  return Math.max(0, (homeworkTotal || 0) - (homeworkSubmitted || 0));
}

/** Cảnh báo BTVN khi ≥ 4 deadline đã tới mà chưa hoàn thành (tính từ ngày hiện tại). */
export function shouldWarnHomework(unfinishedCount: number): boolean {
  return unfinishedCount >= HOMEWORK_UNFINISHED_WARNING_THRESHOLD;
}

export function buildWarningTypes(
  absentCount: number,
  homeworkSubmitted: number,
  homeworkTotal: number,
): WarningType[] {
  const types: WarningType[] = [];
  if (shouldWarnAbsent(absentCount)) types.push("absent_exceeded");
  else if (shouldNotifyAbsentSoft(absentCount)) types.push("absent_notice");
  if (
    shouldWarnHomework(
      unfinishedHomeworkCount(homeworkSubmitted, homeworkTotal),
    )
  ) {
    types.push("homework_insufficient");
  }
  return types;
}

export function isAcaTableWarning(types: WarningType[]): boolean {
  return (
    types.includes("absent_exceeded") || types.includes("homework_insufficient")
  );
}

export function normalizeAcademicWarning(w: AcademicWarningRecord): AcademicWarningRecord {
  const firstStageCompleted = hasCompletedFirstStage(w);
  const warningTypes = buildWarningTypes(
    w.absentCount,
    w.homeworkSubmitted,
    w.homeworkTotal,
  );
  return { ...w, firstStageCompleted, warningTypes };
}

const STORAGE_KEY = "xalo.academic_warnings.v5";
export const ACADEMIC_WARNING_UPDATE_EVENT = "xalo-academic-warning-updated";

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACADEMIC_WARNING_UPDATE_EVENT));
}

function loadAll(): AcademicWarningRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as AcademicWarningRecord[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAll(rows: AcademicWarningRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  dispatchUpdate();
}

export async function listAcademicWarnings(): Promise<AcademicWarningRecord[]> {
  if (canUseAcaApi()) {
    try {
      const rows = await fetchAcaAcademicWarningsApi();
      if (Array.isArray(rows)) {
        return rows
          .map(normalizeAcademicWarning)
          .filter(
            (w) =>
              isAcaTableWarning(w.warningTypes) &&
              (w.handledStatus === "pending" || !w.handledStatus),
          );
      }
    } catch {
      if (getAuthToken()) return [];
    }
  }
  if (getAuthToken()) return [];
  return loadAll()
    .map(normalizeAcademicWarning)
    .filter(
      (w) =>
        isAcaTableWarning(w.warningTypes) &&
        (w.handledStatus === "pending" || !w.handledStatus),
    );
}

export async function listTeacherAcademicWarnings(
  teacherName?: string,
): Promise<AcademicWarningRecord[]> {
  if (canUseAcaApi()) {
    try {
      const rows = await fetchTeacherAcademicWarningsApi(teacherName);
      if (Array.isArray(rows)) {
        return rows
          .map(normalizeAcademicWarning)
          .filter(
            (w) =>
              isAcaTableWarning(w.warningTypes) &&
              (w.handledStatus === "pending" || !w.handledStatus),
          );
      }
    } catch {
      if (getAuthToken()) return [];
    }
  }
  if (getAuthToken()) return [];
  const all = await listAcademicWarnings();
  if (!teacherName?.trim()) return all;
  const target = teacherName.trim().toLowerCase();
  return all.filter((w) => {
    const text = (w.teacherName || "").toLowerCase();
    return text.includes(target) || target.includes(text);
  });
}

export async function getStudentAcademicWarning(
  studentId?: string,
  studentName?: string
): Promise<AcademicWarningRecord | null> {
  if (canUseAcaApi()) {
    try {
      const rows = await fetchStudentAcademicWarningsApi();
      if (Array.isArray(rows) && rows.length > 0) {
        const normalized = rows
          .map(normalizeAcademicWarning)
          .filter(
            (w) =>
              w.warningTypes.length > 0 &&
              w.notificationSentToStudent &&
              !w.studentNotificationDismissed,
          );
        return normalized[0] ?? null;
      }
      if (Array.isArray(rows)) return null;
    } catch {
      // fall through
    }
  }

  const all = loadAll().map(normalizeAcademicWarning);
  const idMatch = studentId ? all.find((w) => w.studentId === studentId && w.warningTypes.length > 0) : null;
  if (idMatch) return idMatch;

  if (studentName) {
    const nameLower = studentName.trim().toLowerCase();
    const nameMatch = all.find(
      (w) =>
        w.warningTypes.length > 0 &&
        (w.studentName.toLowerCase().includes(nameLower) ||
          nameLower.includes(w.studentName.toLowerCase()))
    );
    if (nameMatch) return nameMatch;
  }

  return null;
}

export async function updateAcademicWarning(
  id: string,
  patch: Partial<AcademicWarningRecord>
): Promise<AcademicWarningRecord> {
  if (canUseAcaApi()) {
    try {
      const row = await updateAcademicWarningApi(id, patch);
      dispatchUpdate();
      return normalizeAcademicWarning(row as AcademicWarningRecord);
    } catch {
      // fall through
    }
  }

  const all = loadAll();
  let target: AcademicWarningRecord | null = null;

  const next = all.map((w) => {
    if (w.id === id) {
      target = {
        ...w,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      return target;
    }
    return w;
  });

  if (!target) throw new Error("Không tìm thấy bản ghi cảnh báo.");
  saveAll(next.map(normalizeAcademicWarning));
  return normalizeAcademicWarning(target);
}

export async function dismissStudentWarning(studentId: string): Promise<void> {
  if (canUseAcaApi()) {
    try {
      await dismissAcademicWarningApi(studentId, true);
      dispatchUpdate();
      return;
    } catch {
      // fall through
    }
  }
  const all = loadAll();
  const next = all.map((w) => {
    if (w.studentId === studentId || w.id === studentId) {
      return { ...w, studentNotificationDismissed: true };
    }
    return w;
  });
  saveAll(next);
}

export async function sendWarningNotificationToStudent(
  id: string,
  message?: string,
): Promise<void> {
  if (canUseAcaApi()) {
    try {
      await notifyAcademicWarningApi(id, message);
      dispatchUpdate();
      return;
    } catch {
      // fall through
    }
  }
  const all = loadAll();
  const next = all.map((w) => {
    if (w.id === id) {
      return {
        ...w,
        notificationSentToStudent: true,
        studentNotificationDismissed: false,
        handledStatus: "contacted" as const,
        lastContactedAt: new Date().toISOString(),
        ...(message?.trim() ? { notificationMessage: message.trim() } : {}),
        updatedAt: new Date().toISOString(),
      };
    }
    return w;
  });
  saveAll(next);
}

export async function createAcademicWarning(
  data: Omit<AcademicWarningRecord, "id" | "createdAt">
): Promise<AcademicWarningRecord> {
  if (canUseAcaApi()) {
    try {
      const row = await createAcademicWarningApi(data);
      dispatchUpdate();
      return normalizeAcademicWarning(row as AcademicWarningRecord);
    } catch {
      // fall through
    }
  }
  const id = `wrn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const record: AcademicWarningRecord = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  const current = loadAll();
  saveAll([normalizeAcademicWarning(record), ...current]);
  return normalizeAcademicWarning(record);
}
