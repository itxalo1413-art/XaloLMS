import type { Attendance, HomeworkStatus, RlpSessionRecord } from './rlp.types';
import { parseAcademicDate } from '../academic-warning/academic-warning.rules';

export type StudentRlpIdentity = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
};

export type StudentRlpProgress = {
  totalSessionsElapsed: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  homeworkSubmitted: number;
  homeworkTotal: number;
  homeworkRate: number;
};

const HOMEWORK_STATUSES: HomeworkStatus[] = [
  'submitted',
  'submitted_waiting',
  'in_progress',
  'overdue',
  'not_assigned',
];

function normalizeKey(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

function digits(value?: string | null): string {
  return (value || '').replace(/\D/g, '');
}

function identityCandidates(identity: StudentRlpIdentity): string[] {
  return [
    identity.id,
    identity.email,
    identity.name,
    identity.phone,
    digits(identity.phone).slice(-9),
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);
}

function lookupMapValue<T extends string>(
  map: Record<string, T> | undefined,
  identity: StudentRlpIdentity,
  allowed: readonly T[],
): T | undefined {
  if (!map) return undefined;
  const keys = Object.keys(map);
  if (keys.length === 0) return undefined;

  const candidates = identityCandidates(identity);
  for (const key of candidates) {
    const value = map[key];
    if (value && (allowed as readonly string[]).includes(value)) return value;
  }

  const wanted = new Set(candidates.map(normalizeKey).filter(Boolean));
  const phoneTail = digits(identity.phone).slice(-9);
  for (const key of keys) {
    const value = map[key];
    if (!value || !(allowed as readonly string[]).includes(value)) continue;
    const nk = normalizeKey(key);
    if (wanted.has(nk)) return value;
    if (phoneTail && digits(key).endsWith(phoneTail)) return value;
  }

  return undefined;
}

function isSessionElapsed(session: RlpSessionRecord, now: Date): boolean {
  const date = parseAcademicDate(session.date);
  if (!date) return false;
  date.setHours(0, 0, 0, 0);
  return date.getTime() <= now.getTime();
}

/** Deadline đã tới (≤ hôm nay). Không có deadline thì fallback theo ngày buổi học. */
export function isHomeworkDeadlineDue(
  session: RlpSessionRecord,
  now: Date,
): boolean {
  const deadline = parseAcademicDate(session.deadline);
  if (deadline) {
    deadline.setHours(0, 0, 0, 0);
    return deadline.getTime() <= now.getTime();
  }
  return isSessionElapsed(session, now);
}

export function lookupStudentAttendance(
  session: RlpSessionRecord,
  identity: StudentRlpIdentity,
): Attendance | undefined {
  return lookupMapValue(session.studentAttendance, identity, ['present', 'absent']);
}

export function lookupStudentHomework(
  session: RlpSessionRecord,
  identity: StudentRlpIdentity,
): HomeworkStatus | undefined {
  return lookupMapValue(session.studentHomework, identity, HOMEWORK_STATUSES);
}

export function isHomeworkAssigned(session: RlpSessionRecord): boolean {
  if (session.homeworkStatus && session.homeworkStatus !== 'not_assigned') return true;
  const map = session.studentHomework || {};
  return Object.values(map).some((status) => status && status !== 'not_assigned');
}

export function isHomeworkSubmittedStatus(status?: HomeworkStatus): boolean {
  return status === 'submitted' || status === 'submitted_waiting';
}

/** Trạng thái BTVN để hiện cho 1 học viên: ưu tiên map cá nhân. */
export function resolveStudentHomework(
  session: RlpSessionRecord,
  identity: StudentRlpIdentity,
): HomeworkStatus {
  const own = lookupStudentHomework(session, identity);
  if (own) return own;
  if (!isHomeworkAssigned(session)) return 'not_assigned';
  return 'in_progress';
}

export function computeStudentRlpProgress(
  sessions: RlpSessionRecord[],
  identity: StudentRlpIdentity,
  nowInput?: Date,
): StudentRlpProgress {
  const now = nowInput ?? new Date();
  now.setHours(0, 0, 0, 0);

  let presentCount = 0;
  let absentCount = 0;
  let homeworkSubmitted = 0;
  let homeworkTotal = 0;

  for (const session of sessions || []) {
    const marked = lookupStudentAttendance(session, identity);

    if (marked === 'present') presentCount += 1;
    else if (marked === 'absent') absentCount += 1;

    // BTVN cảnh báo: chỉ tính deadline đã tới (≤ hôm nay) và chưa hoàn thành.
    // Không dùng % nộp; unfinished = homeworkTotal - homeworkSubmitted.
    if (!isHomeworkDeadlineDue(session, now)) continue;
    const hwStatus = resolveStudentHomework(session, identity);
    if (hwStatus === 'not_assigned') continue;
    homeworkTotal += 1;
    if (isHomeworkSubmittedStatus(hwStatus)) {
      homeworkSubmitted += 1;
    }
  }

  const totalSessionsElapsed = presentCount + absentCount;
  const attendanceRate =
    totalSessionsElapsed > 0
      ? Math.round((presentCount / totalSessionsElapsed) * 1000) / 10
      : 0;
  const homeworkRate =
    homeworkTotal > 0
      ? Math.round((homeworkSubmitted / homeworkTotal) * 1000) / 10
      : 100;

  return {
    totalSessionsElapsed,
    presentCount,
    absentCount,
    attendanceRate,
    homeworkSubmitted,
    homeworkTotal,
    homeworkRate,
  };
}

export function formatAttendanceCount(progress: StudentRlpProgress): string {
  if (progress.totalSessionsElapsed <= 0) return '';
  return `${progress.presentCount}/${progress.totalSessionsElapsed}`;
}

export function formatHomeworkPercent(progress: StudentRlpProgress): string {
  if (progress.homeworkTotal <= 0) return '';
  return `${Math.round(progress.homeworkRate)}%`;
}
