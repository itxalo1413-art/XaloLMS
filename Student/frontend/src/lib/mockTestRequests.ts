/**
 * Demo: chia sẻ yêu cầu Mock Test giữa Student và ACA qua localStorage.
 * Production: thay bằng API.
 */

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
  /** Band điểm sau khi chấm (demo / API). */
  score?: string;
  /** Link đề / tài liệu buổi test. */
  examLink?: string;
};

export const MOCK_TEST_STORAGE_KEY = "lms_mock_test_requests_v1";
export const MOCK_TEST_UPDATE_EVENT = "lms-mock-test-updated";

export const DEMO_STUDENT = {
  id: "student-demo-1",
  name: "Dương Ngọc Khôi Nguyên",
};

function parse(raw: string | null): MockTestRequest[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as MockTestRequest[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function loadMockTestRequests(): MockTestRequest[] {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(MOCK_TEST_STORAGE_KEY));
}

export function saveMockTestRequests(rows: MockTestRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOCK_TEST_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(MOCK_TEST_UPDATE_EVENT));
}

export function upsertMockTestRequest(row: MockTestRequest) {
  const all = loadMockTestRequests();
  const i = all.findIndex((r) => r.id === row.id);
  if (i === -1) all.push(row);
  else all[i] = row;
  saveMockTestRequests(all);
}

export function removeMockTestRequest(id: string) {
  saveMockTestRequests(loadMockTestRequests().filter((r) => r.id !== id));
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
