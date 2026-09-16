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
    const raw = await response.text().catch(() => "");
    try {
      const body = JSON.parse(raw) as { message?: string | string[]; error?: string };
      if (typeof body.message === "string" && body.message.trim()) message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
      else if (typeof body.error === "string" && body.error.trim()) message = body.error;
    } catch {
      if (raw.trim()) message = raw.trim().slice(0, 200);
    }
    if (
      response.status >= 500 &&
      (/internal server error/i.test(message) ||
        /ECONNREFUSED|ENOTFOUND|querySrv|MongoNetwork|buffering timed out/i.test(message) ||
        message.startsWith("Writing API failed"))
    ) {
      message =
        "Không kết nối được cơ sở dữ liệu Writing (MongoDB Atlas). Kiểm tra mạng/DNS rồi thử lại.";
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
    criteriaScores?: WritingSubmission["criteriaScores"];
  },
): Promise<WritingSubmission> {
  const response = await apiFetch(`/api/teacher/writing-submissions/${id}/grade`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ submission: WritingSubmission }>(response);
  return data.submission;
}
