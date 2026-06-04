/** Lớp luyện đề tập trung — lịch tuần (API) + fallback localStorage khi chưa đăng nhập. */

import { students } from "@/components/teacher/mockData";
import {
  applyMockTestCache,
  DEMO_STUDENT,
  loadMockTestRequests,
  MOCK_TEST_UPDATE_EVENT,
} from "@/lib/mockTestRequests";
import {
  canUsePracticeClassApi,
  fetchPracticeRegistrations,
  fetchPracticeRegistrationsForAca,
  fetchPracticeScheduleForAca,
  fetchPracticeScheduleForStudent,
  registerPracticeSlotApi,
  savePracticeScheduleForAca,
  unregisterPracticeSlotApi,
  type PracticeRegistrationAcaRow,
  type PracticeScheduleResponse,
} from "@/lib/practiceClassApi";

export const PRACTICE_CLASS_SKILL = "Lớp luyện đề tập trung";

export const PRACTICE_CLASS_DESCRIPTION =
  "Lớp Luyện đề có nội dung học tập tập trung hoàn toàn vào chữa đề actual test và đề mà giáo viên đánh giá là tiệm cận với xu hướng ra đề hiện tại.";

/** Hiển thị trên tab đăng ký lớp luyện đề (Hỗ trợ tự học) */
export const PRACTICE_CLASS_WEEKLY_REREGISTER_WARNING =
  "Lưu ý: Bạn phải đăng ký lại lịch lớp luyện đề mỗi tuần tại tab này. Đăng ký tuần trước không được giữ sang tuần mới.";

export const PRACTICE_SLOT_IDS = ["sun-lrw", "tue-lrw", "sat-speaking"] as const;
export type PracticeSlotId = (typeof PRACTICE_SLOT_IDS)[number];

export type PracticeMeetingAccess = {
  meetingId: string;
  password: string;
  joinUrl: string;
};

/** Phòng Zoom chung cho mọi buổi luyện đề trên Zoom — không đổi theo từng slot. */
export const PRACTICE_CLASS_ZOOM_ROOM: PracticeMeetingAccess = {
  meetingId: "842 1963 4521",
  password: "XaloLrw26",
  joinUrl: "https://zoom.us/j/84219634521?pwd=example-lrw",
};

export function isPracticeZoomPlatform(platform: string): boolean {
  return platform.toLowerCase().includes("zoom");
}

export function resolvePracticeMeetingAccess(slot: PracticeClassSlot): PracticeMeetingAccess {
  if (isPracticeZoomPlatform(slot.platform)) return PRACTICE_CLASS_ZOOM_ROOM;
  return slot.meeting;
}

export type PracticeClassSlot = {
  id: PracticeSlotId;
  dayOfWeek: number;
  dayLabel: string;
  time: string;
  title: string;
  detail: string;
  platform: string;
  dateNote?: string;
  meeting: PracticeMeetingAccess;
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
    meeting: {
      meetingId: "meet-lrw-sun",
      password: "Không cần mật khẩu",
      joinUrl: "https://meet.google.com/abc-defg-hij",
    },
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
    meeting: PRACTICE_CLASS_ZOOM_ROOM,
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
    meeting: PRACTICE_CLASS_ZOOM_ROOM,
  },
];

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

export type { PracticeRegistrationAcaRow };

const REGISTRATIONS_KEY = "xalo.student.practiceClassSlots.v1";
const LEGACY_REGISTRATION_KEY = "xalo.student.practiceClassRegistration.v1";
const SCHEDULE_KEY = "xalo.aca.practiceClassWeeklySchedule.v1";
const WEEKLY_RESET_MARKER_KEY = "xalo.student.practiceClassWeeklyResetMarker.v1";

export const PRACTICE_CLASS_UPDATE_EVENT = "xalo-practice-class-updated";
export const PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT = "xalo-practice-class-schedule-updated";

let scheduleCache: PracticeClassSlot[] = DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE.map((s) => ({
  ...s,
}));
let weekRangeLabelCache = "";
let scheduleUpdatedAtCache: string | null = null;
let registrationsCache: PracticeSlotRegistration[] = [];

const JOINED_KEY = "xalo.student.practiceClassJoined.v1";
const MOCK_TEST_STORAGE_KEY = "lms_mock_test_requests_v1";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
let weeklyResetTimer: number | null = null;

function dispatchPracticeEvents() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PRACTICE_CLASS_UPDATE_EVENT));
  window.dispatchEvent(new Event(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT));
}

/**
 * Mốc reset tuần: 23:00 Chủ nhật (theo giờ máy người dùng).
 * Trả về timestamp của mốc gần nhất <= now.
 */
function getLatestWeeklyResetMarker(now: Date): number {
  const marker = new Date(now);
  marker.setHours(23, 0, 0, 0);
  const day = marker.getDay(); // 0 = Sunday
  marker.setDate(marker.getDate() - day);
  if (now.getTime() < marker.getTime()) {
    marker.setDate(marker.getDate() - 7);
  }
  return marker.getTime();
}

function getNextWeeklyResetAt(now: Date): Date {
  const latest = new Date(getLatestWeeklyResetMarker(now));
  return new Date(latest.getTime() + ONE_WEEK_MS);
}

function applyWeeklyPracticeResetLocal(markerTs: number): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(REGISTRATIONS_KEY);
  localStorage.removeItem(LEGACY_REGISTRATION_KEY);
  localStorage.removeItem(JOINED_KEY);
  registrationsCache = [];

  // Dọn mock-test được tạo từ đăng ký lớp luyện đề.
  const kept = loadMockTestRequests().filter(
    (r) => !r.skill.startsWith(PRACTICE_CLASS_SKILL),
  );
  applyMockTestCache(kept);
  try {
    localStorage.setItem(MOCK_TEST_STORAGE_KEY, JSON.stringify(kept));
    localStorage.setItem(WEEKLY_RESET_MARKER_KEY, String(markerTs));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(MOCK_TEST_UPDATE_EVENT));
  dispatchPracticeEvents();
}

function ensureWeeklyPracticeReset(now = new Date()): void {
  if (typeof window === "undefined") return;
  const latestMarker = getLatestWeeklyResetMarker(now);
  let storedMarker = 0;
  try {
    storedMarker = Number(localStorage.getItem(WEEKLY_RESET_MARKER_KEY) ?? "0");
  } catch {
    storedMarker = 0;
  }
  if (latestMarker > storedMarker) {
    applyWeeklyPracticeResetLocal(latestMarker);
  }
}

function scheduleWeeklyPracticeReset(): void {
  if (typeof window === "undefined") return;
  if (weeklyResetTimer !== null) {
    window.clearTimeout(weeklyResetTimer);
  }
  const now = new Date();
  const next = getNextWeeklyResetAt(now);
  const delay = Math.max(1000, next.getTime() - now.getTime() + 1000);
  weeklyResetTimer = window.setTimeout(() => {
    ensureWeeklyPracticeReset(new Date());
    scheduleWeeklyPracticeReset();
  }, delay);
}

export function isPracticeClassJoined(studentId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(JOINED_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(data?.[studentId]);
  } catch {
    return false;
  }
}

export function setPracticeClassJoined(studentId: string, joined: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(JOINED_KEY);
    const data = (raw ? (JSON.parse(raw) as Record<string, boolean>) : {}) ?? {};
    const next = { ...data, [studentId]: joined };
    localStorage.setItem(JOINED_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  dispatchPracticeEvents();
}

export function clearPracticeClassJoined(studentId?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!studentId) {
      localStorage.removeItem(JOINED_KEY);
      dispatchPracticeEvents();
      return;
    }
    const raw = localStorage.getItem(JOINED_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Record<string, boolean>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [studentId]: _removed, ...rest } = data ?? {};
    localStorage.setItem(JOINED_KEY, JSON.stringify(rest));
  } catch {
    // ignore
  }
  dispatchPracticeEvents();
}

function normalizePracticeSlot(slot: PracticeClassSlot): PracticeClassSlot {
  const base = DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE.find((s) => s.id === slot.id);
  const fallback = base?.meeting ?? {
    meetingId: "—",
    password: "—",
    joinUrl: "—",
  };
  const merged: PracticeClassSlot = {
    ...base,
    ...slot,
    meeting: slot.meeting ?? fallback,
  };
  return {
    ...merged,
    meeting: resolvePracticeMeetingAccess(merged),
  };
}

export function applyPracticeScheduleCache(res: PracticeScheduleResponse) {
  scheduleCache = res.slots.map(normalizePracticeSlot);
  weekRangeLabelCache = res.weekRangeLabel?.trim() ?? "";
  scheduleUpdatedAtCache = res.updatedAt;
}

export function applyPracticeRegistrationsCache(
  studentId: string,
  rows: { slotId: PracticeSlotId; registeredAt: string }[],
) {
  registrationsCache = rows.map((r) => ({
    studentId,
    slotId: r.slotId,
    registeredAt: r.registeredAt,
  }));
}

export function getDefaultPracticeWeeklySchedule(): PracticeClassSlot[] {
  return DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE.map((s) => ({ ...s }));
}

function loadPracticeScheduleStoreLocal(): PracticeClassScheduleStore | null {
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

function mergeScheduleFromLocalStore(): PracticeScheduleResponse {
  const store = loadPracticeScheduleStoreLocal();
  const slots = DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE.map((base) => {
    const override = store?.slots[base.id];
    if (!override) return { ...base };
    return {
      ...base,
      dayLabel: override.dayLabel.trim() || base.dayLabel,
      time: override.time.trim() || base.time,
      dateNote: override.dateNote?.trim() || undefined,
    };
  });
  return {
    weekRangeLabel: store?.weekRangeLabel?.trim() ?? "",
    updatedAt: store?.updatedAt ?? null,
    slots,
  };
}

export function getPracticeWeeklySchedule(): PracticeClassSlot[] {
  return scheduleCache;
}

export function getPracticeWeekRangeLabel(): string | null {
  const label = weekRangeLabelCache.trim();
  return label || null;
}

export function getPracticeScheduleUpdatedAt(): string | null {
  return scheduleUpdatedAtCache;
}

export async function refreshPracticeScheduleForStudent(): Promise<PracticeScheduleResponse> {
  if (canUsePracticeClassApi()) {
    try {
      const res = await fetchPracticeScheduleForStudent();
      applyPracticeScheduleCache(res);
      dispatchPracticeEvents();
      return res;
    } catch {
      // fall through to local
    }
  }
  const local = mergeScheduleFromLocalStore();
  applyPracticeScheduleCache(local);
  return local;
}

export async function refreshPracticeScheduleForAca(): Promise<PracticeScheduleResponse> {
  if (canUsePracticeClassApi()) {
    const res = await fetchPracticeScheduleForAca();
    applyPracticeScheduleCache(res);
    dispatchPracticeEvents();
    return res;
  }
  const local = mergeScheduleFromLocalStore();
  applyPracticeScheduleCache(local);
  return local;
}

export async function savePracticeScheduleFromAca(
  weekRangeLabel: string,
  slotDrafts: Record<PracticeSlotId, PracticeSlotScheduleOverride>,
): Promise<PracticeScheduleResponse> {
  if (canUsePracticeClassApi()) {
    const res = await savePracticeScheduleForAca(weekRangeLabel, slotDrafts);
    applyPracticeScheduleCache(res);
    dispatchPracticeEvents();
    return res;
  }
  if (typeof window === "undefined") {
    return mergeScheduleFromLocalStore();
  }
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
  const merged = mergeScheduleFromLocalStore();
  applyPracticeScheduleCache(merged);
  dispatchPracticeEvents();
  return merged;
}

function resolveStudentNameForAca(studentId: string): string {
  const fromMock = students.find((s) => s.id === studentId);
  if (fromMock) return fromMock.name;
  if (studentId === DEMO_STUDENT.id) return DEMO_STUDENT.name;
  return studentId;
}

function loadPracticeSlotRegistrationsLocal(): PracticeSlotRegistration[] {
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

export async function refreshAllPracticeRegistrationsForAca(): Promise<
  PracticeRegistrationAcaRow[]
> {
  if (canUsePracticeClassApi()) {
    try {
      return await fetchPracticeRegistrationsForAca();
    } catch {
      // fall through
    }
  }
  return loadPracticeSlotRegistrationsLocal()
    .map((row) => {
      const slot = getPracticeSlotById(row.slotId);
      return {
        studentId: row.studentId,
        studentName: resolveStudentNameForAca(row.studentId),
        slotId: row.slotId,
        slotTitle: slot?.title ?? row.slotId,
        slotSchedule: slot ? `${slot.dayLabel} · ${slot.time}` : "—",
        registeredAt: row.registeredAt,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    );
}

export async function refreshPracticeRegistrations(
  studentId: string,
): Promise<PracticeSlotRegistration[]> {
  if (canUsePracticeClassApi()) {
    try {
      const { registrations } = await fetchPracticeRegistrations();
      applyPracticeRegistrationsCache(studentId, registrations);
      dispatchPracticeEvents();
      return registrationsCache;
    } catch {
      // fall through
    }
  }
  registrationsCache = loadPracticeSlotRegistrationsLocal().filter(
    (r) => r.studentId === studentId,
  );
  return registrationsCache;
}

export function getPracticeSlotsForStudent(studentId: string): PracticeSlotRegistration[] {
  return registrationsCache.filter((r) => r.studentId === studentId);
}

export function isPracticeSlotRegistered(
  studentId: string,
  slotId: PracticeSlotId,
): boolean {
  return getPracticeSlotsForStudent(studentId).some((r) => r.slotId === slotId);
}

export function clearPracticeClassRegistrations(studentId?: string): void {
  if (typeof window === "undefined") return;
  if (studentId) {
    const all = loadPracticeSlotRegistrationsLocal().filter((r) => r.studentId !== studentId);
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(all));
    registrationsCache = registrationsCache.filter((r) => r.studentId !== studentId);
  } else {
    localStorage.removeItem(REGISTRATIONS_KEY);
    registrationsCache = [];
  }
  localStorage.removeItem(LEGACY_REGISTRATION_KEY);
  dispatchPracticeEvents();
}

export function resetPracticeClassTestState(studentId: string): void {
  if (typeof window === "undefined") return;
  clearPracticeClassJoined(studentId);
  clearPracticeClassRegistrations(studentId);
  const next = loadMockTestRequests().filter(
    (r) => r.studentId !== studentId || !r.skill.startsWith(PRACTICE_CLASS_SKILL),
  );
  applyMockTestCache(next);
  try {
    localStorage.setItem("lms_mock_test_requests_v1", JSON.stringify(next));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(MOCK_TEST_UPDATE_EVENT));
}

function registerPracticeSlotLocal(studentId: string, slotId: PracticeSlotId): void {
  if (isPracticeSlotRegistered(studentId, slotId)) return;
  setPracticeClassJoined(studentId, true);
  const row: PracticeSlotRegistration = {
    studentId,
    slotId,
    registeredAt: new Date().toISOString(),
  };
  const next = [...loadPracticeSlotRegistrationsLocal(), row];
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(next));
  registrationsCache = [...registrationsCache.filter((r) => r.studentId !== studentId), ...next.filter((r) => r.studentId === studentId)];
  dispatchPracticeEvents();
}

function unregisterPracticeSlotLocal(studentId: string, slotId: PracticeSlotId): void {
  const next = loadPracticeSlotRegistrationsLocal().filter(
    (r) => !(r.studentId === studentId && r.slotId === slotId),
  );
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(next));
  registrationsCache = registrationsCache.filter(
    (r) => !(r.studentId === studentId && r.slotId === slotId),
  );
  dispatchPracticeEvents();
}

export async function registerPracticeSlot(
  studentId: string,
  slotId: PracticeSlotId,
): Promise<void> {
  if (canUsePracticeClassApi()) {
    await registerPracticeSlotApi(slotId);
    await refreshPracticeRegistrations(studentId);
    return;
  }
  registerPracticeSlotLocal(studentId, slotId);
}

export async function unregisterPracticeSlot(
  studentId: string,
  slotId: PracticeSlotId,
): Promise<void> {
  if (canUsePracticeClassApi()) {
    await unregisterPracticeSlotApi(slotId);
    await refreshPracticeRegistrations(studentId);
    return;
  }
  unregisterPracticeSlotLocal(studentId, slotId);
}

export function getPracticeSlotById(slotId: PracticeSlotId): PracticeClassSlot | undefined {
  return getPracticeWeeklySchedule().find((s) => s.id === slotId);
}

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

/** Khởi tạo cache từ local (SSR / lần đầu). */
export function initPracticeClassCacheFromLocal(): void {
  ensureWeeklyPracticeReset();
  applyPracticeScheduleCache(mergeScheduleFromLocalStore());
  registrationsCache = loadPracticeSlotRegistrationsLocal();
}

if (typeof window !== "undefined") {
  initPracticeClassCacheFromLocal();
  scheduleWeeklyPracticeReset();
}
