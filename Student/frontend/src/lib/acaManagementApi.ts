import { parseApiJson } from "@/lib/apiBase";
import { apiFetch, isAuthDisabled, getAuthToken } from "@/lib/auth";

export function normalizeClassification(cls: string): string {
  const c = (cls || "").trim().toLowerCase();
  if (c.includes("combo")) return "Combo";
  if (c.includes("học lại") || c.includes("hoc lai")) return "Học lại";
  if (c.includes("chuyển lớp") || c.includes("chuyen lop")) return "Chuyển lớp";
  return "Lớp lẻ mới";
}

/** Bỏ đuôi `-số` tháng ở cuối mã lớp (vd. -4, -5, -6, -12). */
export function displayClassCode(code: string): string {
  const c = (code || "").trim();
  return c.replace(/-\d+$/i, "");
}

export function classCodesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return displayClassCode(a).toUpperCase() === displayClassCode(b).toUpperCase();
}

function normalizeClassCodeValue(code: string | undefined): string | undefined {
  if (!code) return code;
  const normalized = displayClassCode(code).toUpperCase();
  return normalized || undefined;
}

function normalizeAcaClass<T extends { classCode?: string }>(item: T): T {
  if (!item.classCode) return item;
  return { ...item, classCode: normalizeClassCodeValue(item.classCode) || item.classCode };
}

function normalizeAcaStudent<T extends AcaStudent>(item: T): T {
  const cycles = item.cycles?.map((cycle) =>
    cycle.classCode
      ? { ...cycle, classCode: normalizeClassCodeValue(cycle.classCode) || cycle.classCode }
      : cycle
  );
  return {
    ...item,
    l1: item.l1 ? normalizeClassCodeValue(item.l1) : item.l1,
    l2: item.l2 ? normalizeClassCodeValue(item.l2) : item.l2,
    l3: item.l3 ? normalizeClassCodeValue(item.l3) : item.l3,
    cycles,
  };
}

function normalizeAcaStudentPayload(data: Partial<AcaStudent>): Partial<AcaStudent> {
  const payload = { ...data };
  if (payload.l1) payload.l1 = normalizeClassCodeValue(payload.l1);
  if (payload.l2) payload.l2 = normalizeClassCodeValue(payload.l2);
  if (payload.l3) payload.l3 = normalizeClassCodeValue(payload.l3);
  if (payload.cycles) {
    payload.cycles = payload.cycles.map((cycle) =>
      cycle.classCode
        ? { ...cycle, classCode: normalizeClassCodeValue(cycle.classCode) || cycle.classCode }
        : cycle
    );
  }
  return payload;
}

function withNormalizedClassCode<T extends { classCode?: string }>(data: T): T {
  if (!data.classCode) return data;
  return { ...data, classCode: normalizeClassCodeValue(data.classCode) || data.classCode };
}

export interface AcaClass {
  id: string;
  classCode: string;
  name: string;
  month: number;
  type: string;
  openDate: string;
  /** Lịch sử các ngày mở lớp trước đây (dd/mm/yyyy), từ cũ nhất đến gần nhất) */
  openDateHistory?: string[];
  teacher: string;
  currentPhase: string;
  phaseStartDate: string;
  phaseStudents: number;
  nextPhaseStartDate: string;
  nextPhase: string;
  slotsToEnroll: number;
  /** Ngày kết thúc lớp (dd/mm/yyyy) */
  endDate?: string;
  /** Ghi chú tiến độ lớp */
  progressNote?: string;
  /** Số ngày thời lượng chặng để chiếu lịch custom */
  phaseDurationDays?: number;
}

export interface AcaStudentCycle {
  classCode: string;
  finalScore: string;
  registeredWriting: boolean;
  registeredMocktest: boolean;
  registeredLuyenDe: boolean;
  homeworkPercent: string;
  attendanceCount: string;
  scores?: {
    l: number | string;
    r: number | string;
    w: number | string;
    s: number | string;
    o: number | string;
  };
  finalScores?: {
    l: number | string;
    r: number | string;
    w: number | string;
    s: number | string;
    o: number | string;
  };
}

export interface AcaStudent {
  id: string;
  classId: string;
  stt: number;
  name: string;
  phone: string;
  email: string;
  classification: string;
  rawClassification?: string;
  scores: {
    l: number | string;
    r: number | string;
    w: number | string;
    s: number | string;
    o: number | string;
  };
  finalScores?: {
    l: number | string;
    r: number | string;
    w: number | string;
    s: number | string;
    o: number | string;
  };
  entrance?: string;
  registeredWriting?: boolean;
  registeredMocktest?: boolean;
  registeredLuyenDe?: boolean;
  homeworkPercent?: string;
  attendanceCount?: string;
  registeredWriting2?: boolean;
  registeredMocktest2?: boolean;
  registeredLuyenDe2?: boolean;
  homeworkPercent2?: string;
  attendanceCount2?: string;
  registeredWriting3?: boolean;
  registeredMocktest3?: boolean;
  registeredLuyenDe3?: boolean;
  homeworkPercent3?: string;
  attendanceCount3?: string;
  l1?: string;
  f1?: string;
  l2?: string;
  f2?: string;
  l3?: string;
  f3?: string;
  bcbLink: string;
  note: string;
  cycles?: AcaStudentCycle[];
  dob?: string;
  zodiac?: string;
  avatarUrl?: string;
  method?: string;
  weeklyHours?: string;
  classEnvironment?: string;
  ieltsMeaning?: string;
  previousBand?: string;
  focusSkills?: string[];
  practiceJoined?: boolean;
  registeredSlotIds?: string[];
}

export interface AcaPracticeWeek {
  id: string;
  weekRange: string;
  linkMeet: string;
  linkTab: string;
  announcement: string;
  templateMessage: string;
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
  linkFolder?: string; // Link Folder Bài Tập Cá Nhân và điểm mỗi tuần
}

export interface AcaPracticeStudent {
  id: string;
  stt: number;
  name: string;
  phone: string;
  rlp: string;
  testScheduleSunday: string;
  scheduleTueSat: string;
  scheduleTue?: string;
  scheduleSat?: string;
  scheduleSun?: string;
  participateLd28: boolean;
  note: string;
  weekRange: string;
}

export interface Aca11Class {
  id: string;
  status: "Đang diễn ra" | "Bảo lưu" | "Đã kết thúc";
  className: string;
  inputNeed: string;
  teacher: string;
  schedule: string;
  startDate: string;
  endDate: string;
  progress: string;
  output: string;
  otherNote: string;
  zoomLink?: string;
  successorLink?: string;
  materials?: string;
  scores?: {
    l: number | string;
    r: number | string;
    w: number | string;
    s: number | string;
    o: number | string;
  };
  finalScores?: {
    l: number | string;
    r: number | string;
    w: number | string;
    s: number | string;
    o: number | string;
  };
  cycles?: {
    scores?: {
      l: number | string;
      r: number | string;
      w: number | string;
      s: number | string;
      o: number | string;
    };
    finalScores?: {
      l: number | string;
      r: number | string;
      w: number | string;
      s: number | string;
      o: number | string;
    };
  }[];
}

export function canUseAcaApi(): boolean {
  return true;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    let message = `ACA API failed (${response.status})`;
    try {
      const body = await parseApiJson<{ message?: string | string[] }>(response);
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("API lỗi")) {
        message = err.message;
      }
    }
    throw new Error(message);
  }
  return parseApiJson<T>(response);
}

// --- Classes API ---
export async function fetchAcaClasses(): Promise<AcaClass[]> {
  if (!canUseAcaApi()) return [];
  const res = await apiFetch("/api/aca/classes", { method: "GET" });
  const raw = await parseJson<any[]>(res);
  return raw.map(item => normalizeAcaClass({ ...item, id: item._id }));
}

export async function createAcaClass(data: Partial<AcaClass>): Promise<AcaClass> {
  const res = await apiFetch("/api/aca/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withNormalizedClassCode(data))
  });
  const raw = await parseJson<any>(res);
  return normalizeAcaClass({ ...raw, id: raw._id });
}

export async function updateAcaClass(id: string, data: Partial<AcaClass>): Promise<AcaClass> {
  const res = await apiFetch(`/api/aca/classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withNormalizedClassCode(data))
  });
  const raw = await parseJson<any>(res);
  return normalizeAcaClass({ ...raw, id: raw._id });
}

export async function deleteAcaClass(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/classes/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

// --- Students API ---
export async function fetchAcaStudents(): Promise<AcaStudent[]> {
  if (!canUseAcaApi()) return [];
  const res = await apiFetch("/api/aca/students", { method: "GET" });
  const raw = await parseJson<any[]>(res);
  return raw.map(item =>
    normalizeAcaStudent({
      ...item,
      id: item._id,
      classification: normalizeClassification(item.classification || ""),
    })
  );
}

export async function createAcaStudent(data: Partial<AcaStudent>): Promise<AcaStudent> {
  const res = await apiFetch("/api/aca/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...normalizeAcaStudentPayload(data),
      classification: data.classification ? normalizeClassification(data.classification) : undefined,
    }),
  });
  const raw = await parseJson<any>(res);
  return normalizeAcaStudent({
    ...raw,
    id: raw._id,
    classification: normalizeClassification(raw.classification || ""),
  });
}

export async function updateAcaStudent(id: string, data: Partial<AcaStudent>): Promise<AcaStudent> {
  const res = await apiFetch(`/api/aca/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...normalizeAcaStudentPayload(data),
      classification: data.classification ? normalizeClassification(data.classification) : undefined,
    }),
  });
  const raw = await parseJson<any>(res);
  return normalizeAcaStudent({
    ...raw,
    id: raw._id,
    classification: normalizeClassification(raw.classification || ""),
  });
}

export async function deleteAcaStudent(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/students/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

// --- Practice Weeks API ---
export async function fetchAcaPracticeWeeks(): Promise<AcaPracticeWeek[]> {
  if (!canUseAcaApi()) return [];
  const res = await apiFetch("/api/aca/practice-weeks", { method: "GET" });
  const raw = await parseJson<any[]>(res);
  return raw.map(item => ({ ...item, id: item._id }));
}

export async function createAcaPracticeWeek(data: Partial<AcaPracticeWeek>): Promise<AcaPracticeWeek> {
  const res = await apiFetch("/api/aca/practice-weeks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function updateAcaPracticeWeek(id: string, data: Partial<AcaPracticeWeek>): Promise<AcaPracticeWeek> {
  const res = await apiFetch(`/api/aca/practice-weeks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function deleteAcaPracticeWeek(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/practice-weeks/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

export function getCurrentRealtimePracticeWeekRange(refDate: Date = new Date()): string {
  const d = new Date(refDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToSat = (day + 1) % 7;
  const startDate = new Date(d);
  startDate.setDate(startDate.getDate() - diffToSat);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const format = (dt: Date) => `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;

  return `${format(startDate)} - ${format(endDate)}`;
}

export async function ensureCurrentRealtimeWeekExists(existingWeeks: AcaPracticeWeek[]): Promise<AcaPracticeWeek[]> {
  const currentRange = getCurrentRealtimePracticeWeekRange();
  const exists = existingWeeks.some(w => w.weekRange === currentRange);
  if (!exists) {
    try {
      const defaultZoomLink = "https://zoom.us/j/84219634521?pwd=example-lrw";
      const created = await createAcaPracticeWeek({
        weekRange: currentRange,
        linkMeet: defaultZoomLink,
        linkTab: "",
        announcement: `[Thông báo về lịch học lớp LĐ]\n\nTuần ${currentRange}:\n - Lớp học bình thường vào thứ 3, thứ 5 và thứ 7\n - Lớp có lịch test tập trung vào CN`,
        templateMessage: `Em ơi, tuần này (${currentRange}) chị gửi lịch lớp Luyện Đề T3, T5, T7 và test tập trung CN nhé!`,
        zoomId: "842 1963 4521",
        zoomPassword: "XaloLrw26",
        scheduleTueTitle: "Luyện tập Speaking theo chuyên đề",
        scheduleTueTime: "19h45 – 21h45",
        scheduleTueInfo: "Tham gia bằng Zoom, học với Giáo viên, phân tích bộ đề Speaking 3 part, được cung cấp từ vựng/phương pháp tiếp cận và luyện tập trực tiếp với Giáo viên.",
        scheduleThuTitle: "Chữa đề L-R-W",
        scheduleThuTime: "19h45 – 21h45",
        scheduleThuInfo: "Tham gia bằng Zoom, học với Giáo viên, tập trung chữa đề Writing và các thắc mắc về Listening – Reading.",
        scheduleSatTitle: "Làm đề L-R-W tập trung",
        scheduleSatTime: "19h – 21h30",
        scheduleSatInfo: "Tham gia bằng Zoom, làm bài trên Google Docs, có nhân viên canh thời gian làm bài và các bạn học viên khác tham gia.",
      });
      return sortAcaPracticeWeeksDescending([created, ...existingWeeks]);
    } catch (e) {
      console.warn("Failed to auto-create current week in DB:", e);
    }
  }
  return sortAcaPracticeWeeksDescending(existingWeeks);
}

export function findCurrentOrLatestPracticeWeekRange(weeks: AcaPracticeWeek[]): string {
  if (!weeks || weeks.length === 0) return getCurrentRealtimePracticeWeekRange();

  const now = new Date();

  function parseDate(dateStr: string): Date | null {
    const parts = dateStr.trim().split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  }

  function parseRange(rangeStr: string): { start: Date; end: Date } | null {
    const [startStr, endStr] = rangeStr.split("-");
    if (!startStr || !endStr) return null;
    const start = parseDate(startStr);
    const end = parseDate(endStr);
    if (!start || !end) return null;
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  for (const w of weeks) {
    const parsed = parseRange(w.weekRange);
    if (parsed) {
      if (now >= parsed.start && now <= parsed.end) {
        return w.weekRange;
      }
    }
  }

  const sorted = [...weeks].sort((a, b) => {
    const ra = parseRange(a.weekRange);
    const rb = parseRange(b.weekRange);
    if (!ra || !rb) return 0;
    return rb.start.getTime() - ra.start.getTime();
  });

  return sorted[0]?.weekRange || weeks[0]?.weekRange || getCurrentRealtimePracticeWeekRange();
}

export function sortAcaPracticeWeeksDescending(weeks: AcaPracticeWeek[]): AcaPracticeWeek[] {
  function parseDate(dateStr: string): Date | null {
    const parts = dateStr.trim().split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  }

  function parseStart(rangeStr: string): Date | null {
    const [startStr] = rangeStr.split("-");
    return startStr ? parseDate(startStr) : null;
  }

  return [...weeks].sort((a, b) => {
    const da = parseStart(a.weekRange);
    const db = parseStart(b.weekRange);
    if (!da || !db) return 0;
    return db.getTime() - da.getTime();
  });
}

// --- Practice Students API ---
export async function fetchAcaPracticeStudents(): Promise<AcaPracticeStudent[]> {
  if (!canUseAcaApi()) return [];
  const res = await apiFetch("/api/aca/practice-students", { method: "GET" });
  const raw = await parseJson<any[]>(res);
  return raw.map(item => ({ ...item, id: item._id }));
}

export async function createAcaPracticeStudent(data: Partial<AcaPracticeStudent>): Promise<AcaPracticeStudent> {
  const res = await apiFetch("/api/aca/practice-students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function updateAcaPracticeStudent(id: string, data: Partial<AcaPracticeStudent>): Promise<AcaPracticeStudent> {
  const res = await apiFetch(`/api/aca/practice-students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function deleteAcaPracticeStudent(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/practice-students/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

// --- 1:1 Classes API ---
export async function fetchAca11Classes(): Promise<Aca11Class[]> {
  if (!canUseAcaApi()) return [];
  const res = await apiFetch("/api/aca/11-classes", { method: "GET" });
  const raw = await parseJson<any[]>(res);
  return raw.map(item => ({ ...item, id: item._id }));
}

export async function createAca11Class(data: Partial<Aca11Class>): Promise<Aca11Class> {
  const res = await apiFetch("/api/aca/11-classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function updateAca11Class(id: string, data: Partial<Aca11Class>): Promise<Aca11Class> {
  const res = await apiFetch(`/api/aca/11-classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function deleteAca11Class(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/11-classes/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

// --- Weekly Docs API ---
export interface WeeklyDoc {
  id: string;
  student: string;
  className: string;
  week: string;
  link: string;
  status: string;
}

export async function fetchWeeklyDocs(): Promise<WeeklyDoc[]> {
  if (!canUseAcaApi()) return [];
  const res = await apiFetch("/api/aca/weekly-docs", { method: "GET" });
  const raw = await parseJson<any[]>(res);
  return raw.map(item => ({ ...item, id: item._id }));
}

export async function createWeeklyDoc(data: Partial<WeeklyDoc>): Promise<WeeklyDoc> {
  const res = await apiFetch("/api/aca/weekly-docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function updateWeeklyDoc(id: string, data: Partial<WeeklyDoc>): Promise<WeeklyDoc> {
  const res = await apiFetch(`/api/aca/weekly-docs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function deleteWeeklyDoc(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/weekly-docs/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

// --- Teacher Assignments API ---
export interface TeacherAssignment {
  id: string;
  teacher: string;
  className: string;
  assignedLevel: string;
}

export async function fetchTeacherAssignments(): Promise<TeacherAssignment[]> {
  if (!canUseAcaApi()) return [];
  const res = await apiFetch("/api/aca/teacher-assignments", { method: "GET" });
  const raw = await parseJson<any[]>(res);
  return raw.map(item => ({ ...item, id: item._id }));
}

export async function createTeacherAssignment(data: Partial<TeacherAssignment>): Promise<TeacherAssignment> {
  const res = await apiFetch("/api/aca/teacher-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function updateTeacherAssignment(id: string, data: Partial<TeacherAssignment>): Promise<TeacherAssignment> {
  const res = await apiFetch(`/api/aca/teacher-assignments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function deleteTeacherAssignment(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/teacher-assignments/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

// --- Free Slots API ---
export interface AcaFreeSlot {
  id: string;
  day: number;
  month: number;
  year: number;
  time: string;
  teacherName?: string;
  status?: string;
  type?: string;
}

export async function fetchAcaFreeSlots(): Promise<AcaFreeSlot[]> {
  try {
    const res = await apiFetch("/api/aca/free-slots", { method: "GET" });
    const raw = await parseJson<any[]>(res);
    const result = raw.map(item => ({ ...item, id: item.id || item._id }));
    if (typeof window !== "undefined") {
      try { localStorage.setItem("xalo.aca.free_slots", JSON.stringify(result)); } catch {}
    }
    return result;
  } catch (err) {
    console.warn("[acaManagementApi] fetchAcaFreeSlots failed, falling back to localStorage", err);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("xalo.aca.free_slots");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  }
}

export async function createAcaFreeSlot(data: Partial<AcaFreeSlot>): Promise<AcaFreeSlot> {
  const res = await apiFetch("/api/aca/free-slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw.id || raw._id };
}

export async function updateAcaFreeSlot(id: string, data: Partial<AcaFreeSlot>): Promise<AcaFreeSlot> {
  const res = await apiFetch(`/api/aca/free-slots/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw.id || raw._id };
}

export async function deleteAcaFreeSlot(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/free-slots/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

// --- Teacher Profiles API ---
export interface AcaTeacherProfileApi {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  status: "active" | "inactive";
  joinDate: string;
  notes?: string;
}

export async function fetchAcaTeacherProfiles(): Promise<AcaTeacherProfileApi[]> {
  try {
    const res = await apiFetch("/api/aca/teacher-profiles", { method: "GET" });
    const raw = await parseJson<any[]>(res);
    return raw.map((item) => ({ ...item, id: item.id || item._id }));
  } catch (err) {
    console.warn("[acaManagementApi] fetchAcaTeacherProfiles failed, returning empty array", err);
    return [];
  }
}

export async function createAcaTeacherProfileApi(
  data: Partial<AcaTeacherProfileApi>
): Promise<AcaTeacherProfileApi> {
  const res = await apiFetch("/api/aca/teacher-profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw.id || raw._id };
}

export async function updateAcaTeacherProfileApi(
  id: string,
  data: Partial<AcaTeacherProfileApi>
): Promise<AcaTeacherProfileApi> {
  const res = await apiFetch(`/api/aca/teacher-profiles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw.id || raw._id };
}

export async function deleteAcaTeacherProfileApi(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/teacher-profiles/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}

// --- Guest Diagnosis Leads ---
export async function fetchGuestDiagnosisLeadsApi() {
  if (!canUseAcaApi()) return null;
  const res = await apiFetch("/api/aca/guest-diagnosis-leads");
  return parseJson<any[]>(res);
}

export async function createGuestDiagnosisLeadApi(input: {
  name: string;
  phone?: string;
  email?: string;
  aim?: string;
}) {
  const res = await apiFetch("/api/aca/guest-diagnosis-leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<any>(res);
}

export async function updateGuestDiagnosisLeadApi(
  id: string,
  patch: {
    status?: string;
    note?: string;
    assignedClassId?: string;
    assignedClassName?: string;
  },
) {
  const res = await apiFetch(`/api/aca/guest-diagnosis-leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJson<any>(res);
}

export async function deleteGuestDiagnosisLeadApi(id: string) {
  const res = await apiFetch(`/api/aca/guest-diagnosis-leads/${id}`, {
    method: "DELETE",
  });
  return parseJson<any>(res);
}

// --- ACA Dashboard KPI ---
export type AcaDashboardKpi = {
  totalUsers: number;
  totalStudents: number;
  totalWriting: number;
  pendingWriting: number;
  pendingMockTest: number;
  totalLeads: number;
  newLeads: number;
};

export async function fetchAcaDashboardKpi(): Promise<AcaDashboardKpi | null> {
  if (!canUseAcaApi()) return null;
  try {
    const res = await apiFetch("/api/aca/dashboard/kpi");
    return parseJson<AcaDashboardKpi>(res);
  } catch {
    return null;
  }
}

// --- Entrance Test Bookings ---
export async function fetchEntranceBookingsApi() {
  if (!canUseAcaApi()) return null;
  const res = await apiFetch("/api/aca/entrance-bookings");
  return parseJson<any[]>(res);
}

export async function createEntranceBookingApi(input: Record<string, unknown>) {
  const res = await apiFetch("/api/aca/entrance-bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<any>(res);
}

export async function updateEntranceBookingApi(
  id: string,
  patch: Record<string, unknown>,
) {
  const res = await apiFetch(`/api/aca/entrance-bookings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJson<any>(res);
}

export async function deleteEntranceBookingApi(id: string) {
  const res = await apiFetch(`/api/aca/entrance-bookings/${id}`, {
    method: "DELETE",
  });
  return parseJson<any>(res);
}

// --- KV Store (Grader Meet Links, Guest Diagnosis) ---
export async function getAcaKv(namespace: string): Promise<Record<string, unknown> | null> {
  if (!canUseAcaApi()) return null;
  try {
    const res = await apiFetch(`/api/aca/kv/${encodeURIComponent(namespace)}`);
    if (!res.ok) return null;
    return parseJson<Record<string, unknown>>(res);
  } catch {
    return null;
  }
}

export async function setAcaKv(
  namespace: string,
  data: Record<string, unknown>,
): Promise<void> {
  await apiFetch(`/api/aca/kv/${encodeURIComponent(namespace)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function mergeAcaKv(
  namespace: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await apiFetch(`/api/aca/kv/${encodeURIComponent(namespace)}/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

// --- Student Diagnosis (ACA) ---
export async function fetchStudentDiagnosisForAca(email: string) {
  if (!canUseAcaApi()) return null;
  try {
    const res = await apiFetch(
      `/api/aca/student-diagnosis/${encodeURIComponent(email)}`,
    );
    if (!res.ok) return null;
    return parseJson<any>(res);
  } catch {
    return null;
  }
}

export async function saveStudentDiagnosisForAca(
  email: string,
  data: Record<string, unknown>,
) {
  const res = await apiFetch(
    `/api/aca/student-diagnosis/${encodeURIComponent(email)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  return parseJson<any>(res);
}
