export const FIRST_STAGE_DAYS = 46;
/** 1 chặng = 18 buổi RLP. */
export const FIRST_STAGE_SESSIONS = 18;
/** 2 chặng (1 khóa học phần) = 36 buổi RLP. */
export const FULL_COURSE_SESSIONS = 36;
/**
 * Ngưỡng cảnh báo BTVN: số deadline đã tới (≤ hôm nay) chưa hoàn thành
 * ≥ 20% tổng buổi học của lớp (mỗi lớp số buổi có thể khác nhau).
 */
export const HOMEWORK_UNFINISHED_OF_SESSIONS_RATE = 0.2;
/** @deprecated dùng homeworkUnfinishedWarningThreshold(totalClassSessions) */
export const HOMEWORK_UNFINISHED_WARNING_THRESHOLD = 4;
/** Vắng 3 buổi: hệ thống tự gửi noti cho học viên (không lên bảng học vụ). */
export const ABSENT_STUDENT_NOTI_THRESHOLD = 3;
/** Vắng từ 4 buổi: hiện trên bảng Cảnh báo học tập của học vụ. */
export const ABSENT_ACA_TABLE_THRESHOLD = 4;
/** @deprecated dùng ABSENT_ACA_TABLE_THRESHOLD */
export const ABSENT_WARNING_THRESHOLD = ABSENT_ACA_TABLE_THRESHOLD;

/** Số buổi chưa nộp tối thiểu để cảnh báo = ceil(20% × tổng buổi lớp). */
export function homeworkUnfinishedWarningThreshold(
  totalClassSessions?: number | null,
  classCode?: string | null,
): number {
  const fromClass = Math.max(0, Math.floor(Number(totalClassSessions) || 0));
  const n =
    fromClass > 0
      ? fromClass
      : requiredFullCourseSessions(classCode || undefined);
  return Math.max(1, Math.ceil(n * HOMEWORK_UNFINISHED_OF_SESSIONS_RATE));
}

export type WarningType =
  | 'absent_notice'
  | 'absent_exceeded'
  | 'homework_insufficient';
export type WarningRiskLevel = 'warning' | 'high' | 'critical';

export function parseAcademicDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const raw = dateStr.trim();
  if (!raw || raw === '-') return null;
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
    parseAcademicDate(input.classOpenDate) ||
    parseAcademicDate(input.phaseStartDate);
  const durationDays =
    input.phaseDurationDays && input.phaseDurationDays > 0
      ? input.phaseDurationDays
      : FIRST_STAGE_DAYS;
  if (start) {
    start.setHours(0, 0, 0, 0);
    const elapsedDays = Math.floor(
      (now.getTime() - start.getTime()) / 86400000,
    );
    if (elapsedDays >= durationDays) return true;
  }

  const sessionsNeeded =
    input.phaseDurationDays && input.phaseDurationDays > 0
      ? Math.max(FIRST_STAGE_SESSIONS, Math.round((input.phaseDurationDays / 7) * 2))
      : FIRST_STAGE_SESSIONS;
  if ((input.totalSessionsElapsed ?? 0) >= sessionsNeeded) return true;

  return false;
}

export function requiredFullCourseSessions(classCode?: string): number {
  const code = (classCode || '').toUpperCase();
  if (code.includes('FOU') || code.includes('FOUND')) return FIRST_STAGE_SESSIONS;
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
    parseAcademicDate(input.classOpenDate) ||
    parseAcademicDate(input.phaseStartDate);
  if (start) {
    start.setHours(0, 0, 0, 0);
    const elapsedDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
    if (elapsedDays >= durationDays * 2) return true;
  }

  if ((input.totalSessionsElapsed ?? 0) >= requiredSessions) return true;

  return false;
}

/** Soft noti học viên khi vắng ≥ 3 (t3). */
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

/** Cảnh báo BTVN khi chưa nộp ≥ 20% tổng buổi học của lớp. */
export function shouldWarnHomework(
  unfinishedCount: number,
  totalClassSessions?: number | null,
  classCode?: string | null,
): boolean {
  return (
    unfinishedCount >=
    homeworkUnfinishedWarningThreshold(totalClassSessions, classCode)
  );
}

export function buildWarningTypes(
  absentCount: number,
  homeworkSubmitted: number,
  homeworkTotal: number,
  totalClassSessions?: number | null,
  classCode?: string | null,
): WarningType[] {
  const types: WarningType[] = [];
  if (shouldWarnAbsent(absentCount)) types.push('absent_exceeded');
  else if (shouldNotifyAbsentSoft(absentCount)) types.push('absent_notice');
  if (
    shouldWarnHomework(
      unfinishedHomeworkCount(homeworkSubmitted, homeworkTotal),
      totalClassSessions,
      classCode,
    )
  ) {
    types.push('homework_insufficient');
  }
  return types;
}

/** Dòng cần học vụ xử lý trên bảng (t4+ vắng hoặc BTVN ≥ 20% buổi lớp). Không gồm soft t3. */
export function isAcaTableWarning(types: WarningType[]): boolean {
  return (
    types.includes('absent_exceeded') || types.includes('homework_insufficient')
  );
}

export function deriveRiskLevel(types: WarningType[]): WarningRiskLevel {
  if (types.includes('absent_exceeded') && types.includes('homework_insufficient')) {
    return 'critical';
  }
  if (types.includes('absent_exceeded')) return 'high';
  if (types.includes('homework_insufficient')) return 'high';
  if (types.includes('absent_notice')) return 'warning';
  return 'warning';
}
