export type ScheduleViewState = {
  year: number;
  month: number;
  selectedDay: number | null;
};

const STORAGE_KEY = "xalo.student.scheduleView.v1";

export const DEFAULT_SCHEDULE_VIEW: ScheduleViewState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedDay: null,
};

export function loadScheduleViewState(): ScheduleViewState {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE_VIEW;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE_VIEW;
    const parsed = JSON.parse(raw) as Partial<ScheduleViewState>;
    const savedYear = typeof parsed.year === "number" ? parsed.year : DEFAULT_SCHEDULE_VIEW.year;
    const savedMonth = typeof parsed.month === "number" ? parsed.month : DEFAULT_SCHEDULE_VIEW.month;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    if (savedYear < currentYear || (savedYear === currentYear && savedMonth < currentMonth)) {
      return DEFAULT_SCHEDULE_VIEW;
    }

    return {
      year: savedYear,
      month: savedMonth,
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
