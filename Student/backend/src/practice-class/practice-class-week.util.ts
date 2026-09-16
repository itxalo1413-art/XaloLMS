/** Parse "dd/mm/yyyy - dd/mm/yyyy" practice week range. */
export function parsePracticeWeekRange(
  rangeStr: string,
): { start: Date; end: Date } | null {
  const parts = rangeStr.split('-').map((s) => s.trim());
  if (parts.length !== 2) return null;

  const parseVi = (dateStr: string): Date | null => {
    const segs = dateStr.trim().split('/');
    if (segs.length !== 3) return null;
    const day = Number(segs[0]);
    const month = Number(segs[1]) - 1;
    const year = Number(segs[2]);
    if (!day || month < 0 || !year) return null;
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const start = parseVi(parts[0]);
  const end = parseVi(parts[1]);
  if (!start || !end) return null;
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getCurrentRealtimePracticeWeekRange(now = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToSat = (day + 1) % 7;
  const startDate = new Date(d);
  startDate.setDate(startDate.getDate() - diffToSat);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} - ${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)}/${endDate.getFullYear()}`;
}

/** Match đăng ký theo tuần — hỗ trợ bản ghi cũ chưa có weekRange (dùng createdAt). */
export function registrationMatchesWeekRange(
  row: { weekRange?: string | null; createdAt?: Date | string | null },
  weekRange: string,
): boolean {
  const target = weekRange.trim();
  if (!target) return false;
  const stored = String(row.weekRange || '').trim();
  if (stored) return stored === target;
  const range = parsePracticeWeekRange(target);
  if (!range || !row.createdAt) return false;
  const created = new Date(row.createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created.getTime() >= range.start.getTime() && created.getTime() <= range.end.getTime();
}

export type PracticeWeekLean = {
  weekRange: string;
  examWeekNumber?: number;
  linkMeet?: string;
  linkTab?: string;
  announcement?: string;
  templateMessage?: string;
  zoomId?: string;
  zoomPassword?: string;
  scheduleTueInfo?: string;
  scheduleThuInfo?: string;
  scheduleSatInfo?: string;
  scheduleTueTitle?: string;
  scheduleThuTitle?: string;
  scheduleSatTitle?: string;
  scheduleTueTime?: string;
  scheduleThuTime?: string;
  scheduleSatTime?: string;
  linkFolder?: string;
};

export function findPracticeWeekForDate(
  weeks: PracticeWeekLean[],
  date = new Date(),
): PracticeWeekLean | null {
  const now = new Date(date);
  now.setHours(12, 0, 0, 0);
  for (const week of weeks) {
    const range = parsePracticeWeekRange(week.weekRange);
    if (!range) continue;
    if (now >= range.start && now <= range.end) return week;
  }
  return null;
}

/** Gán weekRange cho bản ghi cũ từ createdAt (khớp aca_practice_weeks hoặc Sat–Fri realtime). */
export function resolveWeekRangeForTimestamp(
  createdAt: Date | string | null | undefined,
  weeks: PracticeWeekLean[],
): string {
  const created = createdAt ? new Date(createdAt) : new Date();
  if (Number.isNaN(created.getTime())) {
    return getCurrentRealtimePracticeWeekRange();
  }
  const match = findPracticeWeekForDate(weeks, created);
  if (match?.weekRange?.trim()) return match.weekRange.trim();
  return getCurrentRealtimePracticeWeekRange(created);
}

export function resolveExamWeekNumber(
  week: PracticeWeekLean,
  allWeeks: PracticeWeekLean[],
): number {
  if (week.examWeekNumber && week.examWeekNumber > 0) {
    return week.examWeekNumber;
  }
  const sorted = [...allWeeks]
    .map((w) => ({
      w,
      range: parsePracticeWeekRange(w.weekRange),
    }))
    .filter((x) => x.range)
    .sort((a, b) => a.range!.start.getTime() - b.range!.start.getTime());
  const idx = sorted.findIndex((x) => x.w.weekRange === week.weekRange);
  return idx >= 0 ? idx + 1 : 1;
}
