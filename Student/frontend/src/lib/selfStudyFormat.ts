import type { MockTestRequest, MockTestRequestStatus } from "@/lib/mockTestRequests";
import type { WritingSubmission, WritingSubmissionStatus } from "@/lib/writingSubmissions";

const MOCK_STATUS_LABEL: Record<MockTestRequestStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

const WRITING_STATUS_LABEL: Record<WritingSubmissionStatus, string> = {
  pending: "Chờ chấm",
  grading: "Đang chấm",
  graded: "Đã chấm",
};

export function formatMockTestDateTime(row: MockTestRequest): string {
  const d = String(row.day).padStart(2, "0");
  const m = String(row.month + 1).padStart(2, "0");
  const time = row.examTime ?? "—";
  return `${d}/${m}/${row.year} · ${time}`;
}

export function mockTestStatusLabel(status: MockTestRequestStatus): string {
  return MOCK_STATUS_LABEL[status];
}

export function writingStatusLabel(status: WritingSubmissionStatus): string {
  return WRITING_STATUS_LABEL[status];
}

export function formatIsoDateTimeVi(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
}

export function sortMockTestsByDateDesc(rows: MockTestRequest[]): MockTestRequest[] {
  return [...rows].sort((a, b) => {
    const ta = new Date(a.year, a.month, a.day).getTime();
    const tb = new Date(b.year, b.month, b.day).getTime();
    return tb - ta;
  });
}

const DEMO_SPEAKING_LINK = "https://docs.google.com/document/d/demo-speaking-mock";

export function speakingResultScore(row: MockTestRequest): string {
  return row.score || "—";
}

export function speakingResultExamLink(row: MockTestRequest): string | null {
  return row.examLink || null;
}

export function isSpeakingMockTest(skill: string): boolean {
  const s = skill.toLowerCase();
  return s.includes("speaking") && !s.includes("luyện");
}

export function mockTestStatusTone(
  status: MockTestRequestStatus,
): "warning" | "success" | "danger" {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export function writingStatusTone(
  status: WritingSubmissionStatus,
): "warning" | "success" | "primary" {
  if (status === "graded") return "success";
  if (status === "grading") return "primary";
  return "warning";
}

export function getDemoSpeakingMockTests(
  studentId: string,
  studentName: string,
): MockTestRequest[] {
  return [
    {
      id: "speaking-demo-1",
      studentId,
      studentName,
      skill: "Speaking Mock Test",
      day: 5,
      month: 4,
      year: 2026,
      status: "approved",
      requestedAt: "2026-04-28T08:00:00.000Z",
      examTime: "09:00",
      examTeacher: "GV Speaking",
      score: "7.0",
      examLink: DEMO_SPEAKING_LINK,
    },
    {
      id: "speaking-demo-2",
      studentId,
      studentName,
      skill: "Speaking Mock Test",
      day: 12,
      month: 4,
      year: 2026,
      status: "pending",
      requestedAt: "2026-05-10T10:00:00.000Z",
      examTime: "14:30",
    },
  ];
}
