/**
 * Mock Test — API + fallback localStorage khi chưa đăng nhập.
 */

import {
  approveMockTestApi,
  canUseMockTestApi,
  cancelMockTestApi,
  createMockTestApi,
  fetchMockTestsForAca,
  fetchMockTestsForStudent,
  fetchMockTestsForTeacher,
  recordMockTestResultApi,
  rejectMockTestApi,
} from "@/lib/mockTestApi";
import { DEFAULT_STUDENT_ID } from "@/lib/studentIds";
import { isSpeakingMockTest } from "@/lib/selfStudyFormat";

export type MockTestRequestStatus = "pending" | "approved" | "rejected";

export type MockTestRequest = {
  id: string;
  studentId: string;
  studentName: string;
  skill: string;
  day: number;
  month: number;
  year: number;
  status: MockTestRequestStatus;
  requestedAt: string;
  examTime?: string;
  examTeacher?: string;
  reviewedAt?: string;
  score?: string;
  examLink?: string;
};

export const MOCK_TEST_STORAGE_KEY = "lms_mock_test_requests_v1";
export const MOCK_TEST_UPDATE_EVENT = "lms-mock-test-updated";

export const DEMO_STUDENT = {
  id: DEFAULT_STUDENT_ID,
  name: "Dương Ngọc Khôi Nguyên",
};

let requestsCache: MockTestRequest[] = [];

function dispatchMockTestUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MOCK_TEST_UPDATE_EVENT));
}

function parse(raw: string | null): MockTestRequest[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as MockTestRequest[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function loadLocal(): MockTestRequest[] {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(MOCK_TEST_STORAGE_KEY));
}

function saveLocal(rows: MockTestRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOCK_TEST_STORAGE_KEY, JSON.stringify(rows));
  requestsCache = rows;
  dispatchMockTestUpdate();
}

export function applyMockTestCache(rows: MockTestRequest[]) {
  requestsCache = rows;
}

export function loadMockTestRequests(): MockTestRequest[] {
  return requestsCache;
}

export async function refreshMockTestRequestsForStudent(
  studentId: string,
): Promise<MockTestRequest[]> {
  if (canUseMockTestApi()) {
    try {
      const rows = await fetchMockTestsForStudent();
      applyMockTestCache(rows);
      dispatchMockTestUpdate();
      return rows;
    } catch {
      // fall through
    }
  }
  const local = loadLocal().filter((r) => r.studentId === studentId);
  applyMockTestCache(loadLocal());
  return local;
}

export async function refreshMockTestRequestsForAca(): Promise<MockTestRequest[]> {
  if (canUseMockTestApi()) {
    const rows = await fetchMockTestsForAca("all");
    applyMockTestCache(rows);
    dispatchMockTestUpdate();
    return rows;
  }
  const local = loadLocal();
  applyMockTestCache(local);
  return local;
}

/** @deprecated Dùng cache sau refresh — giữ tên cho tương thích */
export function saveMockTestRequests(rows: MockTestRequest[]) {
  saveLocal(rows);
}

export function upsertMockTestRequest(row: MockTestRequest) {
  const all = loadMockTestRequests();
  const i = all.findIndex((r) => r.id === row.id);
  if (i === -1) all.push(row);
  else all[i] = row;
  saveLocal(all);
}

export async function removeMockTestRequest(id: string, studentId?: string): Promise<void> {
  if (canUseMockTestApi()) {
    await cancelMockTestApi(id);
    if (studentId) await refreshMockTestRequestsForStudent(studentId);
    return;
  }
  saveLocal(loadLocal().filter((r) => r.id !== id));
}

export function hasDuplicateSlot(
  studentId: string,
  skill: string,
  day: number,
  month: number,
  year: number,
  excludeId?: string,
): boolean {
  return loadMockTestRequests().some(
    (r) =>
      r.id !== excludeId &&
      r.studentId === studentId &&
      r.skill === skill &&
      r.day === day &&
      r.month === month &&
      r.year === year &&
      (r.status === "pending" || r.status === "approved"),
  );
}

export function createPendingRequest(input: {
  studentId: string;
  studentName: string;
  skill: string;
  day: number;
  month: number;
  year: number;
  examTime?: string;
}): MockTestRequest {
  const id = `mt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    ...input,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };
}

export async function createMockTestRequest(input: {
  studentId: string;
  studentName: string;
  skill: string;
  day: number;
  month: number;
  year: number;
  examTime?: string;
}): Promise<MockTestRequest> {
  if (canUseMockTestApi()) {
    const row = await createMockTestApi({
      skill: input.skill,
      day: input.day,
      month: input.month,
      year: input.year,
      examTime: input.examTime,
    });
    await refreshMockTestRequestsForStudent(input.studentId);
    return row;
  }
  const row = createPendingRequest(input);
  saveLocal([...loadLocal(), row]);
  return row;
}

export async function approveMockTestRequest(
  id: string,
  payload: { examTime: string; examTeacher: string },
): Promise<void> {
  if (canUseMockTestApi()) {
    await approveMockTestApi(id, payload);
    await refreshMockTestRequestsForAca();
    return;
  }
  const next = loadLocal().map((x) =>
    x.id === id
      ? {
          ...x,
          status: "approved" as const,
          examTime: payload.examTime,
          examTeacher: payload.examTeacher,
          reviewedAt: new Date().toISOString(),
        }
      : x,
  );
  saveLocal(next);
}

export async function refreshMockTestRequestsForTeacher(
  teacherName: string,
): Promise<MockTestRequest[]> {
  if (canUseMockTestApi()) {
    try {
      const rows = await fetchMockTestsForTeacher(teacherName);
      const byId = new Map(rows.map((r) => [r.id, r]));
      const merged = loadLocal().map((r) => byId.get(r.id) ?? r);
      for (const r of rows) {
        if (!merged.some((m) => m.id === r.id)) merged.push(r);
      }
      saveLocal(merged);
      return rows;
    } catch {
      // fall through
    }
  }
  const local = loadLocal().filter(
    (r) =>
      r.status === "approved" &&
      (r.examTeacher ?? "").trim() === teacherName.trim() &&
      isSpeakingMockTest(r.skill),
  );
  return local;
}

export async function submitMockTestSpeakingResult(
  id: string,
  teacherName: string,
  payload: { score: string; examLink: string },
): Promise<MockTestRequest> {
  const score = payload.score.trim();
  const examLink = payload.examLink.trim();
  if (!score) throw new Error("Vui lòng nhập điểm");
  if (!examLink) throw new Error("Vui lòng nhập link bài chấm");

  if (canUseMockTestApi()) {
    const row = await recordMockTestResultApi(id, {
      score,
      examLink,
      teacherName,
    });
    upsertMockTestRequest(row);
    dispatchMockTestUpdate();
    return row;
  }

  const existing = loadMockTestRequests().find((r) => r.id === id);
  if (!existing) throw new Error("Không tìm thấy ca mock test");
  if ((existing.examTeacher ?? "").trim() !== teacherName.trim()) {
    throw new Error("Ca không thuộc giáo viên này");
  }
  const updated: MockTestRequest = {
    ...existing,
    score,
    examLink,
  };
  upsertMockTestRequest(updated);
  return updated;
}

export async function rejectMockTestRequest(id: string): Promise<void> {
  if (canUseMockTestApi()) {
    await rejectMockTestApi(id);
    await refreshMockTestRequestsForAca();
    return;
  }
  const next = loadLocal().map((x) =>
    x.id === id
      ? {
          ...x,
          status: "rejected" as const,
          reviewedAt: new Date().toISOString(),
        }
      : x,
  );
  saveLocal(next);
}

if (typeof window !== "undefined") {
  applyMockTestCache(loadLocal());
}
