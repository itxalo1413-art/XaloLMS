"use client";

import {
  canUseAcaApi,
  cancelFinalTestApi,
  cancelMyFinalTestApi,
  confirmFinalTestApi,
  createFinalTestApi,
  createMyFinalTestApi,
  fetchFinalTestsApi,
  fetchMyFinalTestsApi,
  fetchTeacherFinalTestsApi,
  submitStudentFinalWritingApi,
  submitTeacherFinalTestResultApi,
  updateFinalTestApi,
  deleteFinalTestApi,
} from "@/lib/acaManagementApi";
import { getAuthToken } from "@/lib/auth";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";

import type { BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";

export type FinalTestType = "full_4_skills" | "speaking" | "writing" | "lr";
export type FinalTestStatus = "scheduled" | "in_progress" | "graded" | "cancelled";
export type FinalTestFormat = "online" | "offline";

export interface FinalTestBcbData {
  overviewTitle?: string;
  overviewSummary?: string;
  speaking?: {
    fc: string; // Fluency & Coherence
    lr: string; // Lexical Resource
    gra: string; // Grammatical Range & Accuracy
    pr: string; // Pronunciation
    strengths?: string;
    weaknesses?: string;
    prescription?: string;
    summary?: string;
  };
  writing?: {
    task1?: {
      ta: string; // Task Achievement
      cc: string; // Coherence & Cohesion
      lr: string; // Lexical Resource
      gra: string; // Grammatical Range & Accuracy
      notes?: string;
    };
    task2?: {
      tr: string; // Task Response
      cc: string; // Coherence & Cohesion
      lr: string; // Lexical Resource
      gra: string; // Grammatical Range & Accuracy
      notes?: string;
    };
    task1Notes?: string;
    task2Notes?: string;
    prescription?: string;
    summary?: string;
    // For backwards compatibility
    ta?: string;
    cc?: string;
    lr?: string;
    gra?: string;
  };
  lr?: {
    listeningCorrect?: string;
    readingCorrect?: string;
    listeningWeaknesses?: string;
    readingWeaknesses?: string;
    listeningSummary?: string;
    readingSummary?: string;
  };
  bcbListening?: BcbQuestionTypeRow[];
  bcbReading?: BcbQuestionTypeRow[];
  generalPrescription?: string;
  targetAchieved?: boolean;
  nextCourseRecommendation?: string;
}

export interface FinalTestRecord {
  id: string;
  hasTakenTest?: boolean; // "Đã thi"
  candidateName: string; // "Tên"
  candidatePhone: string; // "SĐT"
  candidateEmail?: string; // "Email"
  studentId?: string;
  classCode?: string; // e.g. "Final M311025"
  className?: string; // "Lớp (final test)"
  classification?: string; // "Phân loại", e.g. "M/U"
  targetBand?: string;
  testType: FinalTestType;
  format: FinalTestFormat;
  examinerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  examDate?: string; // Ngày học viên đăng ký thi final
  speakingDate?: string; // Ngày học viên đăng ký thi speaking final
  speakingTime?: string; // Giờ thi speaking final
  day: number;
  month: number; // 0-indexed
  year: number;
  status: FinalTestStatus;
  meetLink?: string; // "LINK MEET (TẠO BẰNG MAIL ACA)"
  examLink?: string;
  submissionLink?: string;
  submissionFolderLink?: string; // "FOLDER BÀI LÀM"
  examFolderLink?: string; // "FOLDER ĐỀ GỐC"
  scoreOverall?: string; // "O"
  scoreListening?: string; // "L"
  scoreReading?: string; // "R"
  scoreWriting?: string; // "W"
  scoreSpeaking?: string; // "S"
  bcbSpreadsheetLink?: string; // "BCB" spreadsheet url
  graderWTask1?: string; // "Chấm W" (đồng bộ cả task 1 & 2)
  graderWTask2?: string;
  graderSpeaking?: string; // do học viên tự đăng ký Speaking
  isChecked?: boolean; // "Check" (khi bật cái đó lên thì kết quả mới được trả về học viên)
  resultStatus?: "Đạt" | "Không đạt"; // "Đạt/Không đạt"
  isDone?: boolean; // "DONE"
  feedback?: string;
  bcbData?: FinalTestBcbData;
  createdAt: string;
  updatedAt?: string;
  note?: string;
}

const STORAGE_KEY = "xalo.sale.final_test_archive.v4";
export const FINAL_TEST_UPDATE_EVENT = "xalo-final-test-archive-updated";

export const FINAL_TEST_TYPE_LABELS: Record<FinalTestType, string> = {
  full_4_skills: "Full 4 Kỹ Năng (L-R-W-S)",
  speaking: "Final Speaking",
  writing: "Final Writing",
  lr: "Final Listening & Reading",
};

export const FINAL_TEST_STATUS_LABELS: Record<FinalTestStatus, string> = {
  scheduled: "Đã xếp lịch",
  in_progress: "Đang thi / Đang chấm",
  graded: "Đã có điểm & BCB",
  cancelled: "Đã hủy",
};

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FINAL_TEST_UPDATE_EVENT));
}

function loadAll(): FinalTestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as FinalTestRecord[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAll(rows: FinalTestRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  dispatchUpdate();
}

function sortByDateDesc(rows: FinalTestRecord[]) {
  return [...rows].sort(
    (a, b) =>
      new Date(`${b.date}T${b.time || "00:00"}`).getTime() -
      new Date(`${a.date}T${a.time || "00:00"}`).getTime(),
  );
}

function asRecord(row: unknown): FinalTestRecord | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Partial<FinalTestRecord>;
  if (!r.id || !r.candidateName) return null;
  return {
    id: String(r.id),
    hasTakenTest: r.hasTakenTest ?? false,
    candidateName: r.candidateName,
    candidatePhone: r.candidatePhone ?? "",
    candidateEmail: r.candidateEmail,
    studentId: r.studentId,
    classCode: r.classCode,
    className: r.className,
    classification: r.classification,
    targetBand: r.targetBand,
    testType: (r.testType as FinalTestType) || "full_4_skills",
    format: (r.format as FinalTestFormat) || "online",
    examinerName: r.examinerName ?? "",
    date: r.date ?? "",
    time: r.time ?? "",
    examDate: r.examDate || r.date || undefined,
    speakingDate: r.speakingDate || undefined,
    speakingTime: r.speakingTime || undefined,
    day: r.day ?? 0,
    month: r.month ?? 0,
    year: r.year ?? 0,
    status: (r.status as FinalTestStatus) || "scheduled",
    meetLink: r.meetLink || undefined,
    examLink: r.examLink || undefined,
    submissionLink: r.submissionLink || undefined,
    submissionFolderLink: r.submissionFolderLink || undefined,
    examFolderLink: r.examFolderLink || undefined,
    scoreOverall: r.scoreOverall || undefined,
    scoreListening: r.scoreListening || undefined,
    scoreReading: r.scoreReading || undefined,
    scoreWriting: r.scoreWriting || undefined,
    scoreSpeaking: r.scoreSpeaking || undefined,
    bcbSpreadsheetLink: r.bcbSpreadsheetLink || undefined,
    graderWTask1: r.graderWTask1 || undefined,
    graderWTask2: r.graderWTask2 || undefined,
    graderSpeaking: r.graderSpeaking || undefined,
    isChecked: r.isChecked ?? false,
    resultStatus: r.resultStatus || undefined,
    isDone: r.isDone ?? false,
    feedback: r.feedback || undefined,
    bcbData: r.bcbData,
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt,
    note: r.note,
  };
}

function mapApiRows(rows: unknown[] | null | undefined): FinalTestRecord[] | null {
  if (!Array.isArray(rows)) return null;
  return sortByDateDesc(rows.map(asRecord).filter((r): r is FinalTestRecord => !!r));
}

export async function listFinalTestRecords(): Promise<FinalTestRecord[]> {
  if (canUseAcaApi()) {
    try {
      const rows = mapApiRows(await fetchFinalTestsApi());
      if (rows) return rows;
    } catch {
      if (getAuthToken()) return [];
    }
  }
  if (getAuthToken()) return [];

  const rows = loadAll();
  return sortByDateDesc(rows);
}

export async function listMyFinalTestRecords(identity?: {
  id?: string;
  name?: string;
}): Promise<FinalTestRecord[]> {
  try {
    const rows = mapApiRows(await fetchMyFinalTestsApi());
    if (rows) return rows;
  } catch {
    if (getAuthToken()) return [];
  }
  if (getAuthToken()) return [];

  const all = loadAll();
  const id = identity?.id?.trim();
  const name = identity?.name?.trim().toLowerCase();
  return all
    .filter((r) => {
      if (id && r.studentId === id) return true;
      if (name && r.candidateName.toLowerCase() === name) return true;
      if (name && r.candidateName.toLowerCase().includes(name)) return true;
      return false;
    })
    .map((r) => (r.isChecked ? r : redactUnreleased(r)));
}

export async function listTeacherFinalTestRecords(
  examinerName?: string,
): Promise<FinalTestRecord[]> {
  try {
    const rows = mapApiRows(await fetchTeacherFinalTestsApi(examinerName));
    if (rows) return rows;
  } catch {
    if (getAuthToken()) return [];
  }
  if (getAuthToken()) return [];

  const name = (examinerName || "").trim().toLowerCase();
  return sortByDateDesc(
    loadAll().filter((r) => {
      if (r.status === "cancelled") return false;
      if (!name) return true;
      return (r.examinerName || "").trim().toLowerCase() === name;
    }),
  );
}

export async function submitTeacherFinalTestResult(
  id: string,
  patch: Partial<
    Pick<
      FinalTestRecord,
      | "scoreOverall"
      | "scoreListening"
      | "scoreReading"
      | "scoreWriting"
      | "scoreSpeaking"
      | "examLink"
      | "feedback"
      | "resultStatus"
      | "status"
      | "isDone"
    >
  >,
): Promise<FinalTestRecord> {
  const payload = {
    ...patch,
    status: patch.status || ("graded" as const),
    isDone: patch.isDone ?? true,
  };
  try {
    const updated = asRecord(await submitTeacherFinalTestResultApi(id, payload));
    if (updated) {
      dispatchUpdate();
      return updated;
    }
  } catch (err) {
    if (getAuthToken()) throw err;
  }
  return updateFinalTestRecord(id, payload);
}

function redactUnreleased(r: FinalTestRecord): FinalTestRecord {
  return {
    ...r,
    scoreOverall: undefined,
    scoreListening: undefined,
    scoreReading: undefined,
    scoreWriting: undefined,
    scoreSpeaking: undefined,
    feedback: undefined,
    bcbData: undefined,
    bcbSpreadsheetLink: undefined,
    resultStatus: undefined,
  };
}

export async function createFinalTestRecord(input: {
  candidateName: string;
  candidatePhone: string;
  candidateEmail?: string;
  studentId?: string;
  classCode?: string;
  className?: string;
  classification?: string;
  targetBand?: string;
  testType: FinalTestType;
  format: FinalTestFormat;
  examinerName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  examDate?: string;
  speakingDate?: string;
  speakingTime?: string;
  meetLink?: string;
  examLink?: string;
  submissionLink?: string;
  submissionFolderLink?: string;
  examFolderLink?: string;
  scoreOverall?: string;
  scoreListening?: string;
  scoreReading?: string;
  scoreWriting?: string;
  scoreSpeaking?: string;
  bcbSpreadsheetLink?: string;
  graderWTask1?: string;
  graderWTask2?: string;
  graderSpeaking?: string;
  isChecked?: boolean;
  resultStatus?: "Đạt" | "Không đạt";
  isDone?: boolean;
  note?: string;
}): Promise<FinalTestRecord> {
  const [yStr, mStr, dStr] = input.date.split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10) - 1;
  const day = parseInt(dStr, 10);

  const meetLink = input.meetLink || "";
  const payload = {
    hasTakenTest: input.isChecked ?? false,
    candidateName: input.candidateName.trim(),
    candidatePhone: input.candidatePhone.trim(),
    candidateEmail: input.candidateEmail?.trim() || "",
    studentId: input.studentId || "",
    classCode: input.classCode || "",
    className: input.className || "",
    classification: input.classification || "",
    targetBand: input.targetBand || "",
    testType: input.testType,
    format: input.format,
    examinerName: (input.examinerName || "").trim(),
    date: input.date,
    time: input.time,
    examDate: input.examDate || input.date,
    speakingDate: input.speakingDate || (input.testType === "speaking" ? input.date : ""),
    speakingTime: input.speakingTime || (input.testType === "speaking" ? input.time : ""),
    day,
    month,
    year,
    status: "scheduled" as FinalTestStatus,
    meetLink: input.format === "online" ? meetLink : "",
    examLink: input.examLink?.trim() || "",
    submissionLink: input.submissionLink?.trim() || "",
    submissionFolderLink: input.submissionFolderLink?.trim() || "",
    examFolderLink: input.examFolderLink?.trim() || "",
    scoreOverall: input.scoreOverall || undefined,
    scoreListening: input.scoreListening || undefined,
    scoreReading: input.scoreReading || undefined,
    scoreWriting: input.scoreWriting || undefined,
    scoreSpeaking: input.scoreSpeaking || undefined,
    bcbSpreadsheetLink: input.bcbSpreadsheetLink?.trim() || "",
    graderWTask1: input.graderWTask1?.trim() || "",
    graderWTask2: input.graderWTask2?.trim() || "",
    graderSpeaking: input.graderSpeaking?.trim() || "",
    isChecked: input.isChecked ?? false,
    resultStatus: input.resultStatus || undefined,
    isDone: input.isDone ?? false,
    note: input.note?.trim() || "",
  };

  if (canUseAcaApi()) {
    try {
      const created = asRecord(await createFinalTestApi(payload));
      if (created) {
        dispatchUpdate();
        return created;
      }
    } catch (acaErr) {
      try {
        const created = asRecord(await createMyFinalTestApi(payload));
        if (created) {
          dispatchUpdate();
          return created;
        }
      } catch (studentErr) {
        if (getAuthToken()) {
          const msg =
            (studentErr instanceof Error && studentErr.message) ||
            (acaErr instanceof Error && acaErr.message) ||
            "Không thể tạo Final Test.";
          throw new Error(msg);
        }
      }
    }
  }
  if (getAuthToken()) {
    throw new Error("Không thể tạo Final Test (chưa nhận được phản hồi từ server).");
  }

  const id = `ft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const record: FinalTestRecord = {
    id,
    ...payload,
    createdAt: new Date().toISOString(),
  };

  const current = loadAll();
  saveAll([record, ...current]);
  return record;
}

export async function submitFinalWritingSubmission(
  id: string,
  submissionLink: string
): Promise<FinalTestRecord> {
  if (canUseAcaApi()) {
    try {
      const updated = asRecord(await submitStudentFinalWritingApi(id, submissionLink));
      if (updated) {
        dispatchUpdate();
        return updated;
      }
    } catch (err) {
      if (getAuthToken()) {
        const msg = err instanceof Error ? err.message : "Không thể nộp bài Final Writing.";
        throw new Error(msg);
      }
    }
  }
  return updateFinalTestRecord(id, {
    submissionLink,
    examLink: submissionLink,
    status: "in_progress",
  });
}

export async function updateFinalTestRecord(
  id: string,
  patch: Partial<FinalTestRecord>
): Promise<FinalTestRecord> {
  if (canUseAcaApi()) {
    try {
      const updated = asRecord(await updateFinalTestApi(id, patch));
      if (updated) {
        dispatchUpdate();
        return updated;
      }
    } catch {
      if (getAuthToken()) {
        throw new Error("Không thể cập nhật Final Test khi backend chưa sẵn sàng.");
      }
    }
  }
  if (getAuthToken()) {
    throw new Error("Không thể cập nhật Final Test khi backend chưa sẵn sàng.");
  }

  const all = loadAll();
  let updated: FinalTestRecord | null = null;

  const next = all.map((b) => {
    if (b.id === id) {
      updated = {
        ...b,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    }
    return b;
  });

  if (!updated) {
    updated = {
      id,
      candidateName: patch.candidateName || "Học viên",
      candidatePhone: patch.candidatePhone || "",
      candidateEmail: patch.candidateEmail || "",
      classCode: patch.classCode || "Chưa xếp lớp",
      className: patch.className || patch.classCode || "Chưa xếp lớp",
      classification: patch.classification || "M/U",
      testType: "full_4_skills",
      format: "online",
      examinerName: patch.examinerName || "Giám khảo",
      date: patch.date || new Date().toISOString().split("T")[0],
      time: "18:00",
      day: new Date().getDate(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      status: "scheduled",
      ...patch,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    next.unshift(updated);
  }
  saveAll(next);
  dispatchUpdate();
  return updated;
}

export async function confirmFinalTestRecord(
  id: string,
  confirmed = true,
  releasedBy?: string,
): Promise<FinalTestRecord> {
  try {
    const updated = asRecord(await confirmFinalTestApi(id, confirmed, releasedBy));
    if (updated) {
      dispatchUpdate();
      return updated;
    }
  } catch {
    // fallthrough
  }
  return updateFinalTestRecord(id, {
    isChecked: confirmed,
    isDone: confirmed,
  });
}

export async function cancelFinalTestRecord(id: string): Promise<void> {
  if (canUseAcaApi()) {
    try {
      await cancelFinalTestApi(id);
      dispatchUpdate();
      return;
    } catch {
      try {
        await cancelMyFinalTestApi(id);
        dispatchUpdate();
        return;
      } catch {
        // fallthrough to local
      }
    }
  }

  const all = loadAll();
  const next = all.map((b) => {
    if (b.id === id) {
      return {
        ...b,
        status: "cancelled" as FinalTestStatus,
        updatedAt: new Date().toISOString(),
      };
    }
    return b;
  });

  saveAll(next);
}

export async function deleteFinalTestRecord(id: string): Promise<void> {
  if (canUseAcaApi()) {
    try {
      await deleteFinalTestApi(id);
      dispatchUpdate();
      return;
    } catch {
      // fallthrough to local
    }
  }

  const all = loadAll();
  const next = all.filter((b) => b.id !== id);
  saveAll(next);
}
