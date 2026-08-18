/**
 * Nộp bài Writing — API khi đã đăng nhập; fallback localStorage chỉ khi chưa auth.
 */

import {
  canUseWritingSubmissionApi,
  createWritingSubmissionApi,
  fetchWritingSubmissionsForStudent,
  fetchWritingSubmissionsForTeacher,
  gradeWritingSubmissionApi,
} from "@/lib/writingSubmissionApi";

export const ACA_GRADERS = [
  "Grader 1",
  "Grader 2",
  "Grader 3",
] as const;

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
  assignedGrader?: string;
};

export const WRITING_SUBMISSIONS_KEY = "xalo.student.writingSubmissions.v1";
export const WRITING_SUBMISSIONS_EVENT = "xalo-writing-submissions-updated";

let submissionsCache: WritingSubmission[] = [];

export function isRealWritingSubmission(r: WritingSubmission): boolean {
  if (!r || !r.id) return false;
  if (r.id.startsWith("wr-demo") || r.id.startsWith("wr-seed")) return false;
  if ((r.examLink || "").includes("demo-writing")) return false;
  return true;
}

export function selectNextAcaGrader(existingRows: WritingSubmission[]): string {
  const counts: Record<string, number> = {};
  for (const g of ACA_GRADERS) {
    counts[g] = 0;
  }
  for (const r of existingRows) {
    if (r.assignedGrader && counts[r.assignedGrader] !== undefined) {
      counts[r.assignedGrader]++;
    }
  }
  let minCount = Infinity;
  let selected: string = ACA_GRADERS[0];
  for (const g of ACA_GRADERS) {
    if (counts[g] < minCount) {
      minCount = counts[g];
      selected = g;
    }
  }
  return selected;
}

export function deduplicateWritingSubmissions(rows: WritingSubmission[]): WritingSubmission[] {
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const result: WritingSubmission[] = [];

  for (const r of rows) {
    if (!r || !r.id) continue;
    if (!isRealWritingSubmission(r)) continue;
    if (seenIds.has(r.id)) continue;
    seenIds.add(r.id);

    const contentKey = `${r.studentId}_${(r.examLink || "").trim()}_${r.testDateTime}_${r.status}_${r.score || ""}`;
    if (seenContent.has(contentKey)) continue;
    seenContent.add(contentKey);

    const clone = { ...r };
    if (!clone.assignedGrader || !ACA_GRADERS.includes(clone.assignedGrader as (typeof ACA_GRADERS)[number])) {
      clone.assignedGrader = selectNextAcaGrader(result);
    }

    result.push(clone);
  }
  return result;
}

export function rebalanceWritingSubmissions(rows: WritingSubmission[]): WritingSubmission[] {
  const counts: Record<string, number> = {};
  for (const g of ACA_GRADERS) counts[g] = 0;

  const result = rows.map((r) => {
    let minCount = Infinity;
    let chosen: string = ACA_GRADERS[0];
    for (const g of ACA_GRADERS) {
      if (counts[g] < minCount) {
        minCount = counts[g];
        chosen = g;
      }
    }
    counts[chosen]++;
    return { ...r, assignedGrader: chosen };
  });

  persistWritingSubmissions(result);
  return result;
}

function dispatchWritingUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WRITING_SUBMISSIONS_EVENT));
}

function parse(raw: string | null): WritingSubmission[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as WritingSubmission[];
    return Array.isArray(data) ? deduplicateWritingSubmissions(data) : [];
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
  const deduped = deduplicateWritingSubmissions(rows);
  window.localStorage.setItem(WRITING_SUBMISSIONS_KEY, JSON.stringify(deduped));
  submissionsCache = deduped;
  dispatchWritingUpdate();
}

function saveCache(rows: WritingSubmission[]) {
  submissionsCache = deduplicateWritingSubmissions(rows);
  dispatchWritingUpdate();
}

function persistWritingSubmissions(rows: WritingSubmission[]) {
  if (canUseWritingSubmissionApi()) {
    saveCache(rows);
  } else {
    saveLocal(rows);
  }
}

export function applyWritingSubmissionsCache(rows: WritingSubmission[]) {
  submissionsCache = deduplicateWritingSubmissions(rows);
}

export function clearAllWritingSubmissions() {
  submissionsCache = [];
  if (typeof window !== "undefined") {
    if (!canUseWritingSubmissionApi()) {
      window.localStorage.removeItem(WRITING_SUBMISSIONS_KEY);
    }
    dispatchWritingUpdate();
  }
}

export function loadWritingSubmissions(): WritingSubmission[] {
  if (canUseWritingSubmissionApi()) {
    return deduplicateWritingSubmissions(submissionsCache);
  }
  const cache = submissionsCache.length > 0 ? submissionsCache : loadLocal();
  return deduplicateWritingSubmissions(cache);
}

export function saveWritingSubmissions(rows: WritingSubmission[]) {
  persistWritingSubmissions(rows);
}

export function createWritingSubmission(input: {
  studentId: string;
  studentName?: string;
  examLink: string;
  testDateTime?: string;
  assignedGrader?: string;
}): WritingSubmission {
  const now = new Date();
  const local = loadWritingSubmissions();
  const assigned = input.assignedGrader?.trim() || selectNextAcaGrader(local);
  return {
    id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studentId: input.studentId,
    studentName: input.studentName,
    examLink: input.examLink,
    testDateTime: input.testDateTime ?? now.toISOString(),
    submittedAt: now.toISOString(),
    status: "pending",
    assignedGrader: assigned,
  };
}

export async function refreshWritingSubmissionsForStudent(
  studentId: string,
): Promise<WritingSubmission[]> {
  if (canUseWritingSubmissionApi()) {
    const rows = await fetchWritingSubmissionsForStudent();
    const deduped = deduplicateWritingSubmissions(rows);
    saveCache(deduped);
    return deduped;
  }
  const local = loadLocal();
  const filtered = deduplicateWritingSubmissions(local.filter((r) => r.studentId === studentId));
  applyWritingSubmissionsCache(filtered);
  return filtered;
}

export async function refreshWritingSubmissionsForTeacher(
  status?: WritingSubmissionStatus | "all",
): Promise<WritingSubmission[]> {
  const filterStatus = status ?? "all";
  if (canUseWritingSubmissionApi()) {
    const rows = await fetchWritingSubmissionsForTeacher(filterStatus === "all" ? undefined : filterStatus);
    const deduped = deduplicateWritingSubmissions(rows);
    saveCache(deduped);
    return deduped;
  }
  const local = loadLocal();
  const filtered =
    filterStatus !== "all"
      ? local.filter((r) => r.status === filterStatus)
      : local;
  const deduped = deduplicateWritingSubmissions(filtered);
  applyWritingSubmissionsCache(deduped);
  return deduped;
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
    try {
      const fresh = await fetchWritingSubmissionsForStudent();
      saveCache(deduplicateWritingSubmissions(fresh));
    } catch {
      const current = loadWritingSubmissions().filter(
        (r) => r.id !== remote.id && r.studentId !== input.studentId,
      );
      saveCache([remote, ...current]);
    }
    return remote;
  }

  const local = loadLocal();
  const existingPending = local.find(
    (r) => r.studentId === input.studentId && (r.status === "pending" || r.status === "grading"),
  );

  if (existingPending) {
    const updated: WritingSubmission = {
      ...existingPending,
      examLink: input.examLink,
      testDateTime: input.testDateTime ?? new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      status: "pending",
      score: undefined,
      gradedAt: undefined,
    };
    const next = local.map((r) => (r.id === existingPending.id ? updated : r));
    saveLocal(next);
    return updated;
  }

  const row = createWritingSubmission(input);
  saveLocal([row, ...local]);
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
    assignedGrader?: string;
  },
): Promise<WritingSubmission> {
  if (canUseWritingSubmissionApi()) {
    const remote = await gradeWritingSubmissionApi(id, payload);
    const exists = loadWritingSubmissions().some((r) => r.id === id);
    const next = exists
      ? loadWritingSubmissions().map((r) => (r.id === id ? remote : r))
      : [remote, ...loadWritingSubmissions()];
    saveCache(next);
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
      assignedGrader: payload.assignedGrader?.trim() !== undefined ? payload.assignedGrader.trim() : r.assignedGrader,
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
  return [...stored].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

if (typeof window !== "undefined" && !canUseWritingSubmissionApi()) {
  applyWritingSubmissionsCache(loadLocal());
}
