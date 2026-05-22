/** Lớp luyện đề tập trung — lịch tuần do ACA cập nhật (demo localStorage). */

import { loadMockTestRequests, saveMockTestRequests } from "@/lib/mockTestRequests";

export const PRACTICE_CLASS_SKILL = "Lớp luyện đề tập trung";

export const PRACTICE_CLASS_DESCRIPTION =
  "Lớp Luyện đề có nội dung học tập tập trung hoàn toàn vào chữa đề actual test và đề mà giáo viên đánh giá là tiệm cận với xu hướng ra đề hiện tại.";

export const PRACTICE_SLOT_IDS = ["sun-lrw", "tue-lrw", "sat-speaking"] as const;
export type PracticeSlotId = (typeof PRACTICE_SLOT_IDS)[number];

export type PracticeClassSlot = {
  id: PracticeSlotId;
  dayOfWeek: number;
  dayLabel: string;
  time: string;
  title: string;
  detail: string;
  platform: string;
  /** Ngày cụ thể trong tuần (vd. 18/05) — ACA cập nhật mỗi tuần */
  dateNote?: string;
};

const DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE: PracticeClassSlot[] = [
  {
    id: "sun-lrw",
    dayOfWeek: 0,
    dayLabel: "CN",
    time: "9h – 11h30",
    title: "Làm đề L-R-W tập trung",
    detail:
      "Tham gia bằng link Google Meet, làm bài trên Google Docs, có nhân viên canh thời gian làm bài và các bạn học viên khác tham gia.",
    platform: "Google Meet",
  },
  {
    id: "tue-lrw",
    dayOfWeek: 2,
    dayLabel: "Thứ 3",
    time: "19h45 – 21h45",
    title: "Chữa đề L-R-W",
    detail:
      "Tham gia bằng Zoom, học với Giáo viên, tập trung chữa đề Writing và các thắc mắc về Listening – Reading.",
    platform: "Zoom",
  },
  {
    id: "sat-speaking",
    dayOfWeek: 6,
    dayLabel: "Thứ 7",
    time: "19h45 – 21h45",
    title: "Chữa đề Speaking",
    detail:
      "Tham gia bằng Zoom, học với Giáo viên, phân tích bộ đề Speaking 3 part, được cung cấp từ vựng/phương pháp tiếp cận và luyện tập trực tiếp với Giáo viên.",
    platform: "Zoom",
  },
];

/** @deprecated Dùng `getPracticeWeeklySchedule()` */
export const PRACTICE_CLASS_WEEKLY_SCHEDULE = DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE;

export type PracticeSlotScheduleOverride = {
  dayLabel: string;
  time: string;
  dateNote?: string;
};

export type PracticeClassScheduleStore = {
  weekRangeLabel: string;
  updatedAt: string;
  slots: Record<PracticeSlotId, PracticeSlotScheduleOverride>;
};

export type PracticeSlotRegistration = {
  studentId: string;
  slotId: PracticeSlotId;
  registeredAt: string;
};

const REGISTRATIONS_KEY = "xalo.student.practiceClassSlots.v1";
const LEGACY_REGISTRATION_KEY = "xalo.student.practiceClassRegistration.v1";
const SCHEDULE_KEY = "xalo.aca.practiceClassWeeklySchedule.v1";

export const PRACTICE_CLASS_UPDATE_EVENT = "xalo-practice-class-updated";
export const PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT = "xalo-practice-class-schedule-updated";

function dispatchPracticeEvents() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PRACTICE_CLASS_UPDATE_EVENT));
  window.dispatchEvent(new Event(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT));
}

export function getDefaultPracticeWeeklySchedule(): PracticeClassSlot[] {
  return DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE.map((s) => ({ ...s }));
}

export function loadPracticeScheduleStore(): PracticeClassScheduleStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PracticeClassScheduleStore;
    if (!data?.slots || typeof data.weekRangeLabel !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

export function getPracticeWeeklySchedule(): PracticeClassSlot[] {
  const store = loadPracticeScheduleStore();
  return DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE.map((base) => {
    const override = store?.slots[base.id];
    if (!override) return { ...base };
    return {
      ...base,
      dayLabel: override.dayLabel.trim() || base.dayLabel,
      time: override.time.trim() || base.time,
      dateNote: override.dateNote?.trim() || undefined,
    };
  });
}

export function getPracticeWeekRangeLabel(): string | null {
  const label = loadPracticeScheduleStore()?.weekRangeLabel?.trim();
  return label || null;
}

export function savePracticeScheduleFromAca(
  weekRangeLabel: string,
  slotDrafts: Record<PracticeSlotId, PracticeSlotScheduleOverride>,
): void {
  if (typeof window === "undefined") return;
  const slots = {} as Record<PracticeSlotId, PracticeSlotScheduleOverride>;
  for (const id of PRACTICE_SLOT_IDS) {
    const d = slotDrafts[id];
    const base = DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE.find((s) => s.id === id)!;
    slots[id] = {
      dayLabel: d?.dayLabel?.trim() || base.dayLabel,
      time: d?.time?.trim() || base.time,
      dateNote: d?.dateNote?.trim() || undefined,
    };
  }
  const store: PracticeClassScheduleStore = {
    weekRangeLabel: weekRangeLabel.trim(),
    updatedAt: new Date().toISOString(),
    slots,
  };
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(store));
  dispatchPracticeEvents();
}

export function loadPracticeSlotRegistrations(): PracticeSlotRegistration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as PracticeSlotRegistration[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getPracticeSlotsForStudent(studentId: string): PracticeSlotRegistration[] {
  return loadPracticeSlotRegistrations().filter((r) => r.studentId === studentId);
}

export function isPracticeSlotRegistered(
  studentId: string,
  slotId: PracticeSlotId,
): boolean {
  return getPracticeSlotsForStudent(studentId).some((r) => r.slotId === slotId);
}

/** Xóa đăng ký buổi luyện đề (demo / test). */
export function clearPracticeClassRegistrations(studentId?: string): void {
  if (typeof window === "undefined") return;
  if (studentId) {
    const next = loadPracticeSlotRegistrations().filter((r) => r.studentId !== studentId);
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(next));
  } else {
    localStorage.removeItem(REGISTRATIONS_KEY);
  }
  localStorage.removeItem(LEGACY_REGISTRATION_KEY);
  dispatchPracticeEvents();
}

/** Reset đăng ký lớp luyện đề + yêu cầu mock test phát sinh khi đăng ký (test). */
export function resetPracticeClassTestState(studentId: string): void {
  if (typeof window === "undefined") return;
  clearPracticeClassRegistrations(studentId);
  const next = loadMockTestRequests().filter(
    (r) => r.studentId !== studentId || !r.skill.startsWith(PRACTICE_CLASS_SKILL),
  );
  saveMockTestRequests(next);
}

export function registerPracticeSlot(studentId: string, slotId: PracticeSlotId): void {
  if (typeof window === "undefined") return;
  if (isPracticeSlotRegistered(studentId, slotId)) return;
  const next = [
    ...loadPracticeSlotRegistrations(),
    { studentId, slotId, registeredAt: new Date().toISOString() },
  ];
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PRACTICE_CLASS_UPDATE_EVENT));
}

export function getPracticeSlotById(slotId: PracticeSlotId): PracticeClassSlot | undefined {
  return getPracticeWeeklySchedule().find((s) => s.id === slotId);
}

/** Các buổi luyện đề đã đăng ký rơi vào ngày `day` trong tháng đang xem. */
export function getRegisteredPracticeSlotsOnCalendarDay(
  studentId: string,
  day: number,
  month: number,
  year: number,
): PracticeSlotRegistration[] {
  const dayOfWeek = new Date(year, month, day).getDay();
  return getPracticeSlotsForStudent(studentId).filter((reg) => {
    const slot = getPracticeSlotById(reg.slotId);
    return slot?.dayOfWeek === dayOfWeek;
  });
}

export function hasRegisteredPracticeOnCalendarDay(
  studentId: string,
  day: number,
  month: number,
  year: number,
): boolean {
  return getRegisteredPracticeSlotsOnCalendarDay(studentId, day, month, year).length > 0;
}
