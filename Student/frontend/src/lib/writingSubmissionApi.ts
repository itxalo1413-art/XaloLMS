import { apiFetch, getAuthToken, isAuthDisabled } from "@/lib/auth";
import type { WritingSubmission } from "@/lib/writingSubmissions";

export function canUseWritingSubmissionApi(): boolean {
  return !isAuthDisabled() && Boolean(getAuthToken());
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    let message = `Writing API failed (${response.status})`;
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

export async function fetchWritingSubmissionsForStudent(): Promise<WritingSubmission[]> {
  const response = await apiFetch("/api/student/writing-submissions", {
    method: "GET",
  });
  return parseJson(response);
}

export async function fetchWritingSubmissionsForTeacher(
  status?: "pending" | "grading" | "graded" | "all",
): Promise<WritingSubmission[]> {
  const q = status && status !== "all" ? `?status=${status}` : "";
  const response = await apiFetch(`/api/teacher/writing-submissions${q}`, {
    method: "GET",
  });
  return parseJson(response);
}

export async function createWritingSubmissionApi(input: {
  examLink: string;
  testDateTime?: string;
  dueDate?: string;
  studentGmail?: string;
  type?: string;
  task1?: string;
  task2?: string;
  note?: string;
  assignedGrader?: string;
}): Promise<WritingSubmission> {
  const response = await apiFetch("/api/student/writing-submissions", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ submission: WritingSubmission }>(response);
  return data.submission;
}

export async function gradeWritingSubmissionApi(
  id: string,
  payload: {
    status?: WritingSubmission["status"];
    score?: string;
    examLink?: string;
    dueDate?: string;
    studentGmail?: string;
    type?: string;
    task1?: string;
    task2?: string;
    note?: string;
    assignedGrader?: string;
  },
): Promise<WritingSubmission> {
  const response = await apiFetch(`/api/teacher/writing-submissions/${id}/grade`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ submission: WritingSubmission }>(response);
  return data.submission;
}
