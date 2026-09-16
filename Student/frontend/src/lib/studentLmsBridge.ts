import { apiFetch, getAuthToken } from "@/lib/auth";

export type StudentOneToOne = {
  id: string;
  status: string;
  className: string;
  studentEmail?: string;
  studentName?: string;
  teacher: string;
  schedule: string;
  startDate: string;
  endDate: string;
  progress: string;
  zoomLink: string;
  successorLink: string;
  materials: string;
};

export type StudentWeeklyDoc = {
  id: string;
  student: string;
  studentEmail?: string;
  className: string;
  week: string;
  link: string;
  status: string;
};

function mapDoc(raw: any): StudentWeeklyDoc {
  return {
    id: String(raw._id || raw.id),
    student: raw.student || "",
    studentEmail: raw.studentEmail || "",
    className: raw.className || "",
    week: raw.week || "",
    link: raw.link || "",
    status: raw.status || "Chưa nộp",
  };
}

export async function fetchStudentOneToOne(): Promise<StudentOneToOne | null> {
  if (!getAuthToken()) return null;
  const res = await apiFetch("/api/student/one-to-one", { method: "GET" });
  if (!res.ok) return null;
  const data = await res.json();
  return data || null;
}

export async function fetchStudentWeeklyDocs(): Promise<StudentWeeklyDoc[]> {
  if (!getAuthToken()) return [];
  const res = await apiFetch("/api/student/weekly-docs", { method: "GET" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map(mapDoc) : [];
}

export async function submitStudentWeeklyDoc(
  id: string,
  link: string,
): Promise<StudentWeeklyDoc> {
  const res = await apiFetch(`/api/student/weekly-docs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Submit failed (${res.status})`);
  }
  return mapDoc(await res.json());
}
