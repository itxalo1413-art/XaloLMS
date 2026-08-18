/** Lớp luyện đề tập trung — lịch tuần (API) + fallback localStorage khi chưa đăng nhập. */

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
  savePracticeZoomForAca,
  unregisterPracticeSlotApi,
  updatePracticeSlotMaterialsApi,
  updateStudentPracticeLinkFolderApi,
  type PracticeRegistrationAcaRow,
  type PracticeScheduleResponse,
} from "@/lib/practiceClassApi";

export const PRACTICE_CLASS_SKILL = "Lớp luyện đề tập trung";

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

const DEFAULT_PRACTICE_ZOOM_ID = "842 1963 4521";
const DEFAULT_PRACTICE_ZOOM_PASSWORD = "XaloLrw26";

const PRACTICE_ZOOM_INFO_KEY = "lms_practice_zoom_info_v1";

let zoomCache = {
  zoomId: DEFAULT_PRACTICE_ZOOM_ID,
  zoomPassword: DEFAULT_PRACTICE_ZOOM_PASSWORD,
};
const linkFolderByStudentCache: Record<string, string> = {};

function loadLocalZoomInfo(): { zoomId: string; zoomPassword: string } {
  if (typeof window === "undefined") return zoomCache;
  try {
    const raw = localStorage.getItem(PRACTICE_ZOOM_INFO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { zoomId?: string; zoomPassword?: string };
      if (parsed.zoomId && parsed.zoomPassword) {
        return { zoomId: parsed.zoomId, zoomPassword: parsed.zoomPassword };
      }
    }
  } catch {
    // ignore
  }
  return {
    zoomId: DEFAULT_PRACTICE_ZOOM_ID,
    zoomPassword: DEFAULT_PRACTICE_ZOOM_PASSWORD,
  };
}

function saveLocalZoomInfo(info: { zoomId: string; zoomPassword: string }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRACTICE_ZOOM_INFO_KEY, JSON.stringify(info));
  } catch {
    // ignore
  }
}

export function applyPracticeZoomCache(info: { zoomId: string; zoomPassword: string }) {
  zoomCache = {
    zoomId: info.zoomId.trim() || DEFAULT_PRACTICE_ZOOM_ID,
    zoomPassword: info.zoomPassword.trim() || DEFAULT_PRACTICE_ZOOM_PASSWORD,
  };
}

export function getPracticeZoomInfo(): { zoomId: string; zoomPassword: string } {
  return zoomCache;
}

export function setPracticeZoomInfo(info: { zoomId: string; zoomPassword: string }): void {
  applyPracticeZoomCache(info);
  if (!canUsePracticeClassApi()) {
    saveLocalZoomInfo(zoomCache);
  }
  dispatchPracticeEvents();
}

export async function savePracticeZoom(
  info: { zoomId: string; zoomPassword: string },
): Promise<void> {
  applyPracticeZoomCache(info);
  if (canUsePracticeClassApi()) {
    const res = await savePracticeZoomForAca(info.zoomId, info.zoomPassword);
    applyPracticeScheduleCache(res);
    dispatchPracticeEvents();
    return;
  }
  saveLocalZoomInfo(zoomCache);
  dispatchPracticeEvents();
}

/** Phòng Zoom chung cho mọi buổi luyện đề trên Zoom — đồng bộ với thiết lập của ACA. */
export const PRACTICE_CLASS_ZOOM_ROOM: PracticeMeetingAccess = {
  get meetingId() { return getPracticeZoomInfo().zoomId; },
  get password() { return getPracticeZoomInfo().zoomPassword; },
  get joinUrl() {
    const cleanId = getPracticeZoomInfo().zoomId.replace(/\s+/g, "");
    return `https://zoom.us/j/${cleanId}?pwd=example-lrw`;
  },
};

export function isPracticeZoomPlatform(platform: string): boolean {
  return platform.toLowerCase().includes("zoom");
}

export function resolvePracticeMeetingAccess(_slot?: PracticeClassSlot): PracticeMeetingAccess {
  const current = getPracticeZoomInfo();
  const cleanId = current.zoomId.replace(/\s+/g, "");
  return {
    meetingId: current.zoomId,
    password: current.zoomPassword,
    joinUrl: `https://zoom.us/j/${cleanId}?pwd=example-lrw`,
  };
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
  materialsUrl?: string;
  meeting: PracticeMeetingAccess;
};

const DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE: PracticeClassSlot[] = [
  {
    id: "tue-lrw",
    dayOfWeek: 2,
    dayLabel: "Thứ 3",
    time: "19h45 – 21h45",
    title: "Luyện tập Speaking theo chuyên đề",
    detail:
      "Tham gia bằng Zoom, học với Giáo viên, phân tích bộ đề Speaking 3 part, được cung cấp từ vựng/phương pháp tiếp cận và luyện tập trực tiếp với Giáo viên.",
    platform: "Zoom",
    meeting: PRACTICE_CLASS_ZOOM_ROOM,
  },
  {
    id: "sun-lrw",
    dayOfWeek: 4,
    dayLabel: "Thứ 5",
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
    time: "19h – 21h30",
    title: "Làm đề L-R-W tập trung",
    detail:
      "Tham gia bằng Zoom, làm bài trên Google Docs, có nhân viên canh thời gian làm bài và các bạn học viên khác tham gia.",
    platform: "Zoom",
    meeting: PRACTICE_CLASS_ZOOM_ROOM,
  },
];

export type PracticeSlotScheduleOverride = {
  dayLabel: string;
  time: string;
  dateNote?: string;
  title?: string;
  detail?: string;
  platform?: string;
  meetingId?: string;
  password?: string;
  joinUrl?: string;
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
  linkFolder?: string;
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
  if (canUsePracticeClassApi()) return;

  localStorage.removeItem(REGISTRATIONS_KEY);
  localStorage.removeItem(LEGACY_REGISTRATION_KEY);
  localStorage.removeItem(JOINED_KEY);
  registrationsCache = [];

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
  if (canUsePracticeClassApi()) return;
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

import { updateAcaStudent } from "@/lib/acaManagementApi";

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
  void updateAcaStudent(studentId, { practiceJoined: joined }).catch((err) =>
    console.warn("Could not sync practiceJoined state to backend", err)
  );
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
  const merged: PracticeClassSlot = {
    ...base,
    ...slot,
    platform: "Zoom",
    meeting: PRACTICE_CLASS_ZOOM_ROOM,
  };
  return merged;
}

export function applyPracticeScheduleCache(res: PracticeScheduleResponse) {
  scheduleCache = res.slots.map(normalizePracticeSlot);
  weekRangeLabelCache = res.weekRangeLabel?.trim() ?? "";
  scheduleUpdatedAtCache = res.updatedAt;
  if (res.zoomId && res.zoomPassword) {
    applyPracticeZoomCache({ zoomId: res.zoomId, zoomPassword: res.zoomPassword });
  }
}

export function applyPracticeRegistrationsCache(
  studentId: string,
  rows: { slotId: PracticeSlotId; registeredAt: string; linkFolder?: string }[],
) {
  registrationsCache = rows.map((r) => ({
    studentId,
    slotId: r.slotId,
    registeredAt: r.registeredAt,
    linkFolder: r.linkFolder?.trim() || undefined,
  }));
  const folder = rows.map((r) => r.linkFolder?.trim()).find(Boolean);
  if (folder) {
    linkFolderByStudentCache[studentId] = folder;
  }
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
      dayLabel: override.dayLabel?.trim() || base.dayLabel,
      time: override.time?.trim() || base.time,
      dateNote: override.dateNote?.trim() || undefined,
      title: override.title?.trim() || base.title,
      detail: override.detail?.trim() || base.detail,
      platform: override.platform?.trim() || base.platform,
      meeting: {
        meetingId: override.meetingId?.trim() || base.meeting.meetingId,
        password: override.password?.trim() || base.meeting.password,
        joinUrl: override.joinUrl?.trim() || base.meeting.joinUrl,
      },
    };
  });
  return {
    weekRangeLabel: store?.weekRangeLabel?.trim() ?? "",
    updatedAt: store?.updatedAt ?? null,
    zoomId: loadLocalZoomInfo().zoomId,
    zoomPassword: loadLocalZoomInfo().zoomPassword,
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
  const slots = {} as Record<PracticeSlotId, PracticeSlotScheduleOverride>;
  for (const id of PRACTICE_SLOT_IDS) {
    const d = slotDrafts[id];
    const base = DEFAULT_PRACTICE_CLASS_WEEKLY_SCHEDULE.find((s) => s.id === id)!;
    slots[id] = {
      dayLabel: d?.dayLabel?.trim() || base.dayLabel,
      time: d?.time?.trim() || base.time,
      dateNote: d?.dateNote?.trim() || undefined,
      title: d?.title?.trim() || base.title,
      detail: d?.detail?.trim() || base.detail,
      platform: d?.platform?.trim() || base.platform,
      meetingId: d?.meetingId?.trim() || base.meeting.meetingId,
      password: d?.password?.trim() || base.meeting.password,
      joinUrl: d?.joinUrl?.trim() || base.meeting.joinUrl,
    };
  }

  if (typeof window !== "undefined") {
    try {
      const store: PracticeClassScheduleStore = {
        weekRangeLabel: weekRangeLabel.trim(),
        updatedAt: new Date().toISOString(),
        slots,
      };
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(store));
    } catch {
      // ignore
    }
  }

  if (canUsePracticeClassApi()) {
    try {
      const res = await savePracticeScheduleForAca(weekRangeLabel, slotDrafts);
      applyPracticeScheduleCache(res);
      dispatchPracticeEvents();
      return res;
    } catch (err) {
      console.warn("savePracticeScheduleForAca failed, using local store:", err);
    }
  }

  const local = mergeScheduleFromLocalStore();
  applyPracticeScheduleCache(local);
  dispatchPracticeEvents();
  return local;
}

function resolveStudentNameForAca(studentId: string, studentName?: string): string {
  const trimmed = studentName?.trim();
  if (trimmed) return trimmed;
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
        id: `${row.studentId}_${row.slotId}`,
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

function filterCurrentWeekRegistrations(list: PracticeSlotRegistration[]): PracticeSlotRegistration[] {
  const latestResetMarker = getLatestWeeklyResetMarker(new Date());
  return list.filter((r) => {
    if (!r.registeredAt) return false;
    const time = new Date(r.registeredAt).getTime();
    return !isNaN(time) && time >= latestResetMarker;
  });
}

export async function refreshPracticeRegistrations(
  studentId: string,
): Promise<PracticeSlotRegistration[]> {
  if (canUsePracticeClassApi()) {
    try {
      const { registrations } = await fetchPracticeRegistrations();
      const validCurrentWeek = filterCurrentWeekRegistrations(registrations);
      applyPracticeRegistrationsCache(studentId, validCurrentWeek);
      return registrationsCache;
    } catch {
      // fall through
    }
  }
  registrationsCache = filterCurrentWeekRegistrations(
    loadPracticeSlotRegistrationsLocal().filter((r) => r.studentId === studentId),
  );
  return registrationsCache;
}

export function getPracticeSlotsForStudent(studentId: string): PracticeSlotRegistration[] {
  return filterCurrentWeekRegistrations(
    registrationsCache.filter((r) => r.studentId === studentId),
  );
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

export async function resetPracticeClassTestState(studentId: string): Promise<void> {
  if (typeof window === "undefined") return;

  if (canUsePracticeClassApi()) {
    try {
      const slots = getPracticeSlotsForStudent(studentId);
      for (const s of slots) {
        await unregisterPracticeSlotApi(s.slotId).catch(() => {});
      }
    } catch {
      // ignore
    }
    registrationsCache = registrationsCache.filter((r) => r.studentId !== studentId);
    clearPracticeClassJoined(studentId);
    setPracticeClassJoined(studentId, false);
    dispatchPracticeEvents();
    return;
  }

  clearPracticeClassJoined(studentId);
  clearPracticeClassRegistrations(studentId);
  setPracticeClassJoined(studentId, false);

  const next = loadMockTestRequests().filter(
    (r) => r.studentId !== studentId || !r.skill.startsWith(PRACTICE_CLASS_SKILL),
  );
  applyMockTestCache(next);
  try {
    localStorage.setItem("lms_mock_test_requests_v1", JSON.stringify(next));
  } catch {
    // ignore
  }
  dispatchPracticeEvents();
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

  const slotIds = registrationsCache.filter((r) => r.studentId === studentId).map((r) => r.slotId);
  void updateAcaStudent(studentId, { practiceJoined: true, registeredSlotIds: slotIds }).catch(() => {});
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

  const slotIds = registrationsCache.filter((r) => r.studentId === studentId).map((r) => r.slotId);
  void updateAcaStudent(studentId, { registeredSlotIds: slotIds }).catch(() => {});
}

export async function registerPracticeSlot(
  studentId: string,
  slotId: PracticeSlotId,
): Promise<void> {
  if (canUsePracticeClassApi()) {
    await registerPracticeSlotApi(slotId);
    setPracticeClassJoined(studentId, true);
    await refreshPracticeRegistrations(studentId);
    dispatchPracticeEvents();
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
    dispatchPracticeEvents();
    return;
  }
  unregisterPracticeSlotLocal(studentId, slotId);
}

export function getPracticeSlotById(slotId: PracticeSlotId): PracticeClassSlot | undefined {
  return getPracticeWeeklySchedule().find((s) => s.id === slotId);
}

export function getSaturdayRotatedWeekNumber(date: Date = new Date()): number {
  const d = new Date(date.getTime());
  const day = d.getDay(); // 0 = Sun, 6 = Sat
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  let weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  if (!weekNo) weekNo = 38;
  // Rotate exam link on Saturday (day 6) or Sunday (day 0)
  if (day === 6 || day === 0) {
    weekNo += 1;
  }
  return weekNo;
}

const PRACTICE_STUDENT_FOLDERS_KEY = "lms_practice_student_folders_v1";

function loadLocalStudentFolder(studentId: string): string {
  if (typeof window === "undefined" || !studentId) return "";
  try {
    const raw = localStorage.getItem(PRACTICE_STUDENT_FOLDERS_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      if (map[studentId]) return map[studentId];
    }
  } catch {
    // ignore
  }
  return "";
}

function saveLocalStudentFolder(studentId: string, url: string) {
  if (typeof window === "undefined" || !studentId) return;
  try {
    const raw = localStorage.getItem(PRACTICE_STUDENT_FOLDERS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[studentId] = url;
    localStorage.setItem(PRACTICE_STUDENT_FOLDERS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getStudentPracticeFolderUrl(studentId: string): string {
  if (!studentId) return "";
  const cached = linkFolderByStudentCache[studentId]?.trim();
  if (cached) return cached;
  if (!canUsePracticeClassApi()) {
    const local = loadLocalStudentFolder(studentId);
    if (local) return local;
  }
  return "";
}

export function setStudentPracticeFolderUrl(studentId: string, url: string): void {
  if (!studentId) return;
  linkFolderByStudentCache[studentId] = url.trim();
  if (!canUsePracticeClassApi()) {
    saveLocalStudentFolder(studentId, url.trim());
  }
  dispatchPracticeEvents();
}

export async function saveStudentPracticeFolderUrl(
  studentId: string,
  url: string,
  options?: { asTeacher?: boolean },
): Promise<void> {
  const trimmed = url.trim();
  setStudentPracticeFolderUrl(studentId, trimmed);
  if (canUsePracticeClassApi()) {
    await updateStudentPracticeLinkFolderApi(studentId, trimmed, options?.asTeacher === true);
  }
}

const PRACTICE_SLOT_MATERIALS_KEY = "lms_practice_slot_materials_v1";

function loadLocalSlotMaterials(slotId: string): string {
  if (typeof window === "undefined" || !slotId) return "";
  try {
    const raw = localStorage.getItem(PRACTICE_SLOT_MATERIALS_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      if (map[slotId]) return map[slotId];
    }
  } catch {
    // ignore
  }
  return "";
}

function saveLocalSlotMaterials(slotId: string, url: string) {
  if (typeof window === "undefined" || !slotId) return;
  try {
    const raw = localStorage.getItem(PRACTICE_SLOT_MATERIALS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[slotId] = url;
    localStorage.setItem(PRACTICE_SLOT_MATERIALS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getPracticeSlotMaterialsUrl(slotId: string, defaultUrl?: string): string {
  const slot = getPracticeSlotById(slotId as PracticeSlotId);
  const fromSchedule = slot?.materialsUrl?.trim();
  if (fromSchedule) return fromSchedule;
  if (!canUsePracticeClassApi()) {
    const local = loadLocalSlotMaterials(slotId);
    if (local) return local;
  }
  return defaultUrl || "https://drive.google.com";
}

export function setPracticeSlotMaterialsUrl(slotId: string, url: string): void {
  if (!slotId) return;
  scheduleCache = scheduleCache.map((slot) =>
    slot.id === slotId ? { ...slot, materialsUrl: url.trim() } : slot,
  );
  if (!canUsePracticeClassApi()) {
    saveLocalSlotMaterials(slotId, url.trim());
  }
  dispatchPracticeEvents();
}

export async function savePracticeSlotMaterialsUrl(
  slotId: PracticeSlotId,
  url: string,
): Promise<void> {
  const trimmed = url.trim();
  if (canUsePracticeClassApi()) {
    const res = await updatePracticeSlotMaterialsApi(slotId, trimmed);
    applyPracticeScheduleCache(res);
    dispatchPracticeEvents();
    return;
  }
  setPracticeSlotMaterialsUrl(slotId, trimmed);
}

export function getISOWeekKey(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function getRegisteredPracticeSlotsOnCalendarDay(
  studentId: string,
  day: number,
  month: number,
  year: number,
): PracticeSlotRegistration[] {
  const targetDate = new Date(year, month, day);
  const now = new Date();

  // Lớp luyện đề đăng ký theo tuần và reset hàng tuần.
  // Chỉ hiển thị highlight trên Thời khóa biểu đối với các ngày thuộc TUẦN HIỆN TẠI.
  if (getISOWeekKey(targetDate) !== getISOWeekKey(now)) {
    return [];
  }

  const dayOfWeek = targetDate.getDay();
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
  if (canUsePracticeClassApi()) {
    return;
  }
  applyPracticeZoomCache(loadLocalZoomInfo());
  ensureWeeklyPracticeReset();
  applyPracticeScheduleCache(mergeScheduleFromLocalStore());
  registrationsCache = loadPracticeSlotRegistrationsLocal();
}

if (typeof window !== "undefined") {
  initPracticeClassCacheFromLocal();
  if (!canUsePracticeClassApi()) {
    scheduleWeeklyPracticeReset();
  }
}
