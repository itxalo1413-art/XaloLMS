export type ScheduleViewState = {
  year: number;
  month: number;
  selectedDay: number | null;
};

const STORAGE_KEY = "xalo.student.scheduleView.v1";

export const DEFAULT_SCHEDULE_VIEW: ScheduleViewState = {
  year: 2026,
  month: 3,
  selectedDay: null,
};

export function loadScheduleViewState(): ScheduleViewState {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE_VIEW;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE_VIEW;
    const parsed = JSON.parse(raw) as Partial<ScheduleViewState>;
    return {
      year: typeof parsed.year === "number" ? parsed.year : DEFAULT_SCHEDULE_VIEW.year,
      month: typeof parsed.month === "number" ? parsed.month : DEFAULT_SCHEDULE_VIEW.month,
      selectedDay:
        typeof parsed.selectedDay === "number" || parsed.selectedDay === null
          ? parsed.selectedDay
          : DEFAULT_SCHEDULE_VIEW.selectedDay,
    };
  } catch {
    return DEFAULT_SCHEDULE_VIEW;
  }
}

export function saveScheduleViewState(state: ScheduleViewState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
