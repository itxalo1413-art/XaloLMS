/**
 * Nộp bài Writing — API + fallback localStorage khi chưa đăng nhập.
 */

import {
  canUseWritingSubmissionApi,
  createWritingSubmissionApi,
  fetchWritingSubmissionsForStudent,
  fetchWritingSubmissionsForTeacher,
  gradeWritingSubmissionApi,
} from "@/lib/writingSubmissionApi";

export type WritingSubmissionStatus = "pending" | "grading" | "graded";

export type WritingSubmission = {
  id: string;
  studentId: string;
  studentName?: string;
  testDateTime: string;
  submittedAt: string;
  status: WritingSubmissionStatus;
  score?: string;
  examLink: string;
  gradedAt?: string;
  dueDate?: string;
  studentGmail?: string;
  type?: string;
  task1?: string;
  task2?: string;
  note?: string;
};

export const WRITING_SUBMISSIONS_KEY = "xalo.student.writingSubmissions.v1";
export const WRITING_SUBMISSIONS_EVENT = "xalo-writing-submissions-updated";

let submissionsCache: WritingSubmission[] = [];

function dispatchWritingUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WRITING_SUBMISSIONS_EVENT));
}

function parse(raw: string | null): WritingSubmission[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as WritingSubmission[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function loadLocal(): WritingSubmission[] {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(WRITING_SUBMISSIONS_KEY));
}

function saveLocal(rows: WritingSubmission[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WRITING_SUBMISSIONS_KEY, JSON.stringify(rows));
  submissionsCache = rows;
  dispatchWritingUpdate();
}

export function applyWritingSubmissionsCache(rows: WritingSubmission[]) {
  submissionsCache = rows;
}

export function loadWritingSubmissions(): WritingSubmission[] {
  return submissionsCache.length > 0 ? submissionsCache : loadLocal();
}

export function saveWritingSubmissions(rows: WritingSubmission[]) {
  saveLocal(rows);
}

export function createWritingSubmission(input: {
  studentId: string;
  studentName?: string;
  examLink: string;
  testDateTime?: string;
}): WritingSubmission {
  const now = new Date();
  return {
    id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studentId: input.studentId,
    studentName: input.studentName,
    examLink: input.examLink,
    testDateTime: input.testDateTime ?? now.toISOString(),
    submittedAt: now.toISOString(),
    status: "pending",
  };
}

export async function refreshWritingSubmissionsForStudent(
  studentId: string,
): Promise<WritingSubmission[]> {
  if (canUseWritingSubmissionApi()) {
    try {
      const rows = await fetchWritingSubmissionsForStudent();
      const others = loadLocal().filter((r) => r.studentId !== studentId);
      const merged = [...rows, ...others];
      applyWritingSubmissionsCache(merged);
      saveLocal(merged);
      return rows;
    } catch {
      // fall through
    }
  }
  const local = loadLocal().filter((r) => r.studentId === studentId);
  const merged =
    local.length > 0 ? local : getDefaultWritingSubmissions(studentId);
  applyWritingSubmissionsCache(merged);
  return merged;
}

export async function refreshWritingSubmissionsForTeacher(
  status?: WritingSubmissionStatus | "all",
): Promise<WritingSubmission[]> {
  if (canUseWritingSubmissionApi()) {
    try {
      const rows = await fetchWritingSubmissionsForTeacher(status);
      applyWritingSubmissionsCache(rows);
      saveLocal(rows);
      return rows;
    } catch {
      // fall through
    }
  }
  const local = loadLocal();
  const filtered =
    status && status !== "all"
      ? local.filter((r) => r.status === status)
      : local;
  applyWritingSubmissionsCache(filtered);
  return filtered;
}

export async function submitWritingSubmission(input: {
  studentId: string;
  studentName?: string;
  examLink: string;
  testDateTime?: string;
}): Promise<WritingSubmission> {
  if (canUseWritingSubmissionApi()) {
    const remote = await createWritingSubmissionApi({
      examLink: input.examLink,
      testDateTime: input.testDateTime,
    });
    const next = [
      remote,
      ...loadLocal().filter((r) => r.id !== remote.id),
    ];
    saveLocal(next);
    return remote;
  }

  const row = createWritingSubmission(input);
  saveLocal([row, ...loadLocal()]);
  return row;
}

export async function gradeWritingSubmission(
  id: string,
  payload: {
    status: WritingSubmissionStatus;
    score?: string;
    examLink?: string;
    dueDate?: string;
    studentGmail?: string;
    type?: string;
    task1?: string;
    task2?: string;
    note?: string;
  },
): Promise<WritingSubmission> {
  if (canUseWritingSubmissionApi()) {
    const remote = await gradeWritingSubmissionApi(id, payload);
    const exists = loadLocal().some((r) => r.id === id);
    const next = exists
      ? loadLocal().map((r) => (r.id === id ? remote : r))
      : [remote, ...loadLocal()];
    saveLocal(next);
    return remote;
  }

  const now = new Date().toISOString();
  let updated: WritingSubmission | null = null;
  const next = loadLocal().map((r) => {
    if (r.id !== id) return r;
    updated = {
      ...r,
      status: payload.status,
      score: payload.score?.trim() !== undefined ? payload.score.trim() : r.score,
      examLink: payload.examLink?.trim() !== undefined ? payload.examLink.trim() : r.examLink,
      dueDate: payload.dueDate?.trim() !== undefined ? payload.dueDate.trim() : r.dueDate,
      studentGmail: payload.studentGmail?.trim() !== undefined ? payload.studentGmail.trim() : r.studentGmail,
      type: payload.type?.trim() !== undefined ? payload.type.trim() : r.type,
      task1: payload.task1?.trim() !== undefined ? payload.task1.trim() : r.task1,
      task2: payload.task2?.trim() !== undefined ? payload.task2.trim() : r.task2,
      note: payload.note?.trim() !== undefined ? payload.note.trim() : r.note,
      gradedAt: payload.status === "graded" ? now : r.gradedAt,
    };
    return updated;
  });
  if (!updated) throw new Error("Không tìm thấy bài nộp");
  saveLocal(next);
  return updated;
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
      studentName: "Dương Ngọc Khôi Nguyên",
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
      studentName: "Dương Ngọc Khôi Nguyên",
      testDateTime: "2026-05-08T14:00:00.000Z",
      submittedAt: "2026-05-08T15:30:00.000Z",
      status: "graded",
      score: "6.5",
      examLink: "https://docs.google.com/document/d/demo-writing-task2",
      gradedAt: "2026-05-10T11:00:00.000Z",
    },
  ];
}
