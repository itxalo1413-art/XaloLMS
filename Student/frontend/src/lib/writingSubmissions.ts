/**
 * Demo: lịch sử nộp bài Writing — localStorage. Production: thay bằng API.
 */

export type WritingSubmissionStatus = "pending" | "grading" | "graded";

export type WritingSubmission = {
  id: string;
  studentId: string;
  /** Ngày giờ làm bài / buổi test */
  testDateTime: string;
  submittedAt: string;
  status: WritingSubmissionStatus;
  score?: string;
  examLink: string;
  gradedAt?: string;
};

export const WRITING_SUBMISSIONS_KEY = "xalo.student.writingSubmissions.v1";
export const WRITING_SUBMISSIONS_EVENT = "xalo-writing-submissions-updated";

function parse(raw: string | null): WritingSubmission[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as WritingSubmission[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function loadWritingSubmissions(): WritingSubmission[] {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(WRITING_SUBMISSIONS_KEY));
}

export function saveWritingSubmissions(rows: WritingSubmission[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WRITING_SUBMISSIONS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(WRITING_SUBMISSIONS_EVENT));
}

export function createWritingSubmission(input: {
  studentId: string;
  examLink: string;
  testDateTime?: string;
}): WritingSubmission {
  const now = new Date();
  return {
    id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studentId: input.studentId,
    examLink: input.examLink,
    testDateTime: input.testDateTime ?? now.toISOString(),
    submittedAt: now.toISOString(),
    status: "pending",
  };
}

export function loadWritingSubmissionsForStudent(studentId: string): WritingSubmission[] {
  const stored = loadWritingSubmissions().filter((r) => r.studentId === studentId);
  if (stored.length > 0) {
    return [...stored].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }
  return getDefaultWritingSubmissions(studentId);
}

function getDefaultWritingSubmissions(studentId: string): WritingSubmission[] {
  return [
    {
      id: "wr-demo-1",
      studentId,
      testDateTime: "2026-05-02T09:00:00.000Z",
      submittedAt: "2026-05-02T10:15:00.000Z",
      status: "graded",
      score: "6.0",
      examLink: "https://docs.google.com/document/d/demo-writing-task1",
      gradedAt: "2026-05-05T14:00:00.000Z",
    },
    {
      id: "wr-demo-2",
      studentId,
      testDateTime: "2026-05-08T14:00:00.000Z",
      submittedAt: "2026-05-08T15:30:00.000Z",
      status: "graded",
      score: "6.5",
      examLink: "https://docs.google.com/document/d/demo-writing-task2",
      gradedAt: "2026-05-10T11:00:00.000Z",
    },
  ];
}
