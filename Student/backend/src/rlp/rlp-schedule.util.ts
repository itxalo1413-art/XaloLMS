/** Phân loại lớp để sinh số buổi RLP. */
export type RlpClassKind = 'foundation' | 'core' | 'module';

/** Học phần (Upstream/Momentum/Soar/…): 1 chặng = 18 buổi, 2 chặng = 36 buổi. */
export const MODULE_RLP_TOTAL_SESSIONS = 36;
export const MODULE_RLP_PHASE1_SESSIONS = 18;

export type RlpSchedulePlan = {
  kind: RlpClassKind;
  dates: string[];
  /** Số buổi thuộc chặng 1 (phần còn lại là chặng 2). Foundation = toàn bộ. */
  phase1Count: number;
};

export function resolveRlpClassKind(name: string, code = ''): RlpClassKind {
  const n = (name || '').toUpperCase();
  const c = (code || '').toUpperCase();
  const blob = `${n} ${c}`;

  if (
    blob.includes('FOU') ||
    blob.includes('FOUND') ||
    /\bF(246|357|SS)\b/.test(blob) ||
    c.startsWith('F246') ||
    c.startsWith('F357') ||
    c.startsWith('FSS')
  ) {
    return 'foundation';
  }

  if (
    blob.includes('PRE CORE') ||
    blob.includes('PCORE') ||
    blob.includes('PRECORE') ||
    blob.includes('PRE IELTS') ||
    blob.includes('PREIELTS') ||
    c.startsWith('PC') ||
    /\bCORE\b/.test(n) ||
    /\bCORE\b/.test(c)
  ) {
    return 'core';
  }

  return 'module';
}

/** Thứ học trong tuần (JS getDay): 0=CN … 6=T7. */
export function resolveRlpTargetDays(name: string, code = ''): number[] {
  const blob = `${name || ''} ${code || ''}`.toUpperCase();
  if (blob.includes('S/S') || blob.includes('SS') || /\bS\s*\/\s*S\b/.test(blob)) {
    return [0, 6]; // CN + T7
  }
  if (blob.includes('357')) return [2, 4, 6]; // T3 T5 T7
  if (blob.includes('246')) return [1, 3, 5]; // T2 T4 T6
  // Mặc định lịch 246
  return [1, 3, 5];
}

export function resolveRlpPhaseDurationDays(
  name: string,
  code = '',
  customDuration?: number,
): number {
  if (customDuration !== undefined && customDuration > 0) return customDuration;
  const kind = resolveRlpClassKind(name, code);
  if (kind === 'foundation') return 105;
  if (kind === 'core') return 60;
  return 42;
}

export function parseViDate(dStr?: string | null): Date | null {
  if (!dStr?.trim()) return null;
  const raw = dStr.trim();
  const vi = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vi) {
    return new Date(Number(vi[3]), Number(vi[2]) - 1, Number(vi[1]));
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatViDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** Lấy đúng `count` ngày học kể từ `start` (inclusive). */
export function walkMeetingDates(
  start: Date,
  count: number,
  targetDays: number[],
): Date[] {
  const dates: Date[] = [];
  const curr = new Date(start);
  let guard = 0;
  while (dates.length < count && guard < 2000) {
    if (targetDays.includes(curr.getDay())) {
      dates.push(new Date(curr));
    }
    curr.setDate(curr.getDate() + 1);
    guard++;
  }
  return dates;
}

/**
 * Các ngày học trong [start, endExclusive).
 * endExclusive = ngày bắt đầu chặng kế (không tính vào chặng hiện tại).
 */
export function meetingDatesInRange(
  start: Date,
  endExclusive: Date,
  targetDays: number[],
): Date[] {
  const dates: Date[] = [];
  const curr = new Date(start);
  const endMs = endExclusive.getTime();
  let guard = 0;
  while (curr.getTime() < endMs && guard < 2000) {
    if (targetDays.includes(curr.getDay())) {
      dates.push(new Date(curr));
    }
    curr.setDate(curr.getDate() + 1);
    guard++;
  }
  return dates;
}

/**
 * Sinh lịch RLP theo loại lớp:
 * - module (học phần): cố định 36 buổi (18 + 18), gán ngày từ khai giảng chặng
 * - foundation / core: số buổi = đếm ngày học trong khoảng chặng (logic khai giảng)
 */
export function buildRlpSchedulePlan(input: {
  className: string;
  classCode?: string;
  phaseStartDate?: string;
  openDate?: string;
  nextPhaseStartDate?: string;
  endDate?: string;
  phaseDurationDays?: number;
}): RlpSchedulePlan {
  const name = input.className || '';
  const code = input.classCode || '';
  const kind = resolveRlpClassKind(name, code);
  const targetDays = resolveRlpTargetDays(name, code);
  const duration = resolveRlpPhaseDurationDays(
    name,
    code,
    input.phaseDurationDays,
  );

  const start =
    parseViDate(input.phaseStartDate) ||
    parseViDate(input.openDate) ||
    new Date();

  const nextPhase = parseViDate(input.nextPhaseStartDate);
  const explicitEnd = parseViDate(input.endDate);

  if (kind === 'module') {
    const phase1Count = MODULE_RLP_PHASE1_SESSIONS;
    const phase2Count = MODULE_RLP_TOTAL_SESSIONS - phase1Count;
    const phase1Dates = walkMeetingDates(start, phase1Count, targetDays);
    let phase2Start: Date;
    if (nextPhase) {
      phase2Start = nextPhase;
    } else if (phase1Dates.length) {
      phase2Start = addDays(phase1Dates[phase1Dates.length - 1], 2);
    } else {
      phase2Start = addDays(start, duration);
    }
    const phase2Dates = walkMeetingDates(phase2Start, phase2Count, targetDays);
    return {
      kind,
      phase1Count,
      dates: [...phase1Dates, ...phase2Dates].map(formatViDate),
    };
  }

  if (kind === 'foundation') {
    const end = explicitEnd || addDays(start, duration);
    // Inclusive end date for foundation single phase
    const endExclusive = addDays(end, 1);
    const dates = meetingDatesInRange(start, endExclusive, targetDays);
    return {
      kind,
      phase1Count: dates.length,
      dates: dates.map(formatViDate),
    };
  }

  // Core / Pre-Core: 2 chặng, mỗi chặng ~2 tháng (60 ngày) — đếm ngày học thực tế
  const phase1End = nextPhase || addDays(start, duration);
  const phase1Dates = meetingDatesInRange(start, phase1End, targetDays);
  const phase2Start = nextPhase || phase1End;
  const phase2End = explicitEnd || addDays(phase2Start, duration);
  const phase2Dates = meetingDatesInRange(
    phase2Start,
    addDays(phase2End, 1),
    targetDays,
  );

  return {
    kind,
    phase1Count: phase1Dates.length,
    dates: [...phase1Dates, ...phase2Dates].map(formatViDate),
  };
}
