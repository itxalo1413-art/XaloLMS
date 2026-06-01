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

export async function fetchMockTestsForStudent(): Promise<MockTestRequest[]> {
  const response = await apiFetch("/api/student/mock-tests", { method: "GET" });
  return parseJson(response);
}

export async function fetchMockTestsForAca(
  status?: "pending" | "approved" | "rejected" | "all",
): Promise<MockTestRequest[]> {
  const q = status && status !== "all" ? `?status=${status}` : "";
  const response = await apiFetch(`/api/aca/mock-tests${q}`, { method: "GET" });
  return parseJson(response);
}

export async function createMockTestApi(input: {
  skill: string;
  day: number;
  month: number;
  year: number;
  examTime?: string;
}): Promise<MockTestRequest> {
  const response = await apiFetch("/api/student/mock-tests", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ request: MockTestRequest }>(response);
  return data.request;
}

export async function cancelMockTestApi(id: string): Promise<void> {
  const response = await apiFetch(`/api/student/mock-tests/${id}`, {
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
  return data.request;
}

export async function rejectMockTestApi(id: string): Promise<MockTestRequest> {
  const response = await apiFetch(`/api/aca/mock-tests/${id}/reject`, {
    method: "PATCH",
  });
  const data = await parseJson<{ request: MockTestRequest }>(response);
  return data.request;
}

export async function fetchMockTestsForTeacher(
  teacherName: string,
): Promise<MockTestRequest[]> {
  const q = encodeURIComponent(teacherName);
  const response = await apiFetch(`/api/teacher/mock-tests?teacherName=${q}`, {
    method: "GET",
  });
  return parseJson(response);
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
  return data.request;
}
