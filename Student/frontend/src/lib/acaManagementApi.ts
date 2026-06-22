import { apiFetch, isAuthDisabled, getAuthToken } from "@/lib/auth";

export interface AcaClass {
  id: string;
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
  bcbLink: string;
  note: string;
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
  return raw.map(item => ({ ...item, id: item._id }));
}

export async function createAcaClass(data: Partial<AcaClass>): Promise<AcaClass> {
  const res = await apiFetch("/api/aca/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function updateAcaClass(id: string, data: Partial<AcaClass>): Promise<AcaClass> {
  const res = await apiFetch(`/api/aca/classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
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
  return raw.map(item => ({ ...item, id: item._id }));
}

export async function createAcaStudent(data: Partial<AcaStudent>): Promise<AcaStudent> {
  const res = await apiFetch("/api/aca/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
}

export async function updateAcaStudent(id: string, data: Partial<AcaStudent>): Promise<AcaStudent> {
  const res = await apiFetch(`/api/aca/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const raw = await parseJson<any>(res);
  return { ...raw, id: raw._id };
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
