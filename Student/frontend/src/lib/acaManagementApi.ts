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
}

export interface AcaPracticeWeek {
  id: string;
  weekRange: string;
  linkMeet: string;
  linkTab: string;
  announcement: string;
  templateMessage: string;
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
      const body = await response.json();
      if (body && typeof body.message === "string") message = body.message;
      else if (body && Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
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
  const res = await apiFetch("/api/aca/free-slots", { method: "GET" });
  const raw = await parseJson<any[]>(res);
  return raw.map(item => ({ ...item, id: item._id }));
}

export async function createAcaFreeSlot(data: Partial<AcaFreeSlot>): Promise<AcaFreeSlot> {
  const res = await apiFetch("/api/aca/free-slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function updateAcaFreeSlot(id: string, data: Partial<AcaFreeSlot>): Promise<AcaFreeSlot> {
  const res = await apiFetch(`/api/aca/free-slots/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function deleteAcaFreeSlot(id: string): Promise<void> {
  const res = await apiFetch(`/api/aca/free-slots/${id}`, { method: "DELETE" });
  await parseJson<any>(res);
}
