import { apiFetch, getAuthToken, isAuthDisabled } from "@/lib/auth";
import type { MockTestRequest } from "@/lib/mockTestRequests";

export function canUseMockTestApi(): boolean {
  return !isAuthDisabled() && Boolean(getAuthToken());
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    let message = `Mock test API failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

function normalizeRow(raw: any): MockTestRequest {
  return {
    ...raw,
    id: raw?.id || raw?._id,
    note: raw?.note || raw?.notes || "",
  };
}

function unwrapRequest(data: any): MockTestRequest {
  const row = data?.request ?? data;
  return normalizeRow(row);
}

function unwrapList(data: any): MockTestRequest[] {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.requests) ? data.requests : [];
  return rows.map(normalizeRow);
}

export async function fetchMockTestsForStudent(): Promise<MockTestRequest[]> {
  const response = await apiFetch("/api/student/mock-tests", { method: "GET" });
  return unwrapList(await parseJson(response));
}

export async function fetchMockTestsForAca(
  status?: "pending" | "approved" | "rejected" | "all",
): Promise<MockTestRequest[]> {
  const q = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiFetch(`/api/aca/mock-tests${q}`, { method: "GET" });
  return unwrapList(await parseJson(response));
}

export async function createMockTestApi(input: {
  skill: string;
  day: number;
  month: number;
  year: number;
  examTime?: string;
  status?: string;
  examTeacher?: string;
  studentName?: string;
  examLink?: string;
  note?: string;
  guestPhone?: string;
  leadId?: string;
  source?: string;
}): Promise<MockTestRequest> {
  const isStaffCreate = Boolean(input.studentName || input.source === "entrance" || input.examTeacher);
  const path = isStaffCreate ? "/api/aca/mock-tests" : "/api/student/mock-tests";
  const response = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrapRequest(await parseJson(response));
}

export async function cancelMockTestApi(id: string): Promise<void> {
  const studentRes = await apiFetch(`/api/student/mock-tests/${id}`, {
    method: "DELETE",
  });
  if (studentRes.ok || studentRes.status === 404) {
    if (studentRes.ok) await parseJson(studentRes);
    if (studentRes.ok) return;
  }
  const response = await apiFetch(`/api/aca/mock-tests/${id}`, {
    method: "DELETE",
  });
  await parseJson(response);
}

export async function approveMockTestApi(
  id: string,
  payload: { examTime: string; examTeacher: string },
): Promise<MockTestRequest> {
  const response = await apiFetch(`/api/aca/mock-tests/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ request: MockTestRequest }>(response);
  return unwrapRequest(data);
}

export async function rejectMockTestApi(id: string): Promise<MockTestRequest> {
  const response = await apiFetch(`/api/aca/mock-tests/${id}/reject`, {
    method: "PATCH",
  });
  const data = await parseJson<{ request: MockTestRequest }>(response);
  return unwrapRequest(data);
}

export async function fetchMockTestsForTeacher(
  teacherName: string,
): Promise<MockTestRequest[]> {
  const q = encodeURIComponent(teacherName);
  const response = await apiFetch(`/api/teacher/mock-tests?teacherName=${q}`, {
    method: "GET",
  });
  return unwrapList(await parseJson(response));
}

export async function recordMockTestResultApi(
  id: string,
  payload: { score: string; examLink?: string; teacherName: string },
): Promise<MockTestRequest> {
  const response = await apiFetch(`/api/teacher/mock-tests/${id}/result`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ request: MockTestRequest }>(response);
  return unwrapRequest(data);
}
