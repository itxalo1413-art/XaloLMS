import { studentScores } from "@/components/teacher/mockData";
import type { BcbGrammarRow, BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";
import {
  GUEST_BCB_GRAMMAR,
  GUEST_BCB_LISTENING,
  GUEST_BCB_READING,
} from "@/lib/guestBcbDiagnosis";
import type { SpeakingCriterionScores } from "@/lib/speakingBandDescriptors";
import { DEFAULT_STUDENT_ID } from "@/lib/studentIds";
import { resolveActiveStudentId } from "@/lib/studentRoster";
import { resolveWritingBands, type WritingCriterionInput } from "@/lib/writingScore";

export type SkillScores = {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
};

export type StudentDiagnosisRecord = {
  aim: string;
  examDate: string;
  bcbOverviewTitle: string;
  bcbOverviewSummary: string;
  bcbLink: string;
  scores: SkillScores;
  skillSummaries: {
    listening: string;
    reading: string;
    speaking: string;
  };
  listeningLink: string;
  readingLink: string;
  writingCriteria: WritingCriterionInput;
  writingSummary: { task1: string; task2: string };
  writingLinks: { task1: string; task2: string };
  speakingCriteria: SpeakingCriterionScores;
  bcbListening: BcbQuestionTypeRow[];
  bcbReading: BcbQuestionTypeRow[];
  bcbGrammar: BcbGrammarRow[];
  updatedAt: string;
};

const DEFAULT_WRITING_CRITERIA: WritingCriterionInput = {
  task1: {
    taskAchievement: 6,
    coherenceCohesion: 7,
    lexicalResource: 6,
    grammaticalRange: 6,
  },
  task2: {
    taskResponse: 6,
    coherenceCohesion: 6,
    lexicalResource: 6,
    grammaticalRange: 6,
  },
};

const writingBands = resolveWritingBands(DEFAULT_WRITING_CRITERIA);

export const DEFAULT_STUDENT_DIAGNOSIS: StudentDiagnosisRecord = {
  aim: "7.5",
  examDate: "2026-08-10",
  bcbOverviewTitle: "Người dùng Khá (Competent)",
  bcbOverviewSummary:
    "Sử dụng ngôn ngữ hiệu quả, thỉnh thoảng có lỗi dùng từ chưa phù hợp. Đã bắt đầu hiểu được ngôn ngữ phức tạp nhưng phong độ chưa đều giữa các kỹ năng.",
  bcbLink: "",
  scores: {
    listening: 7.5,
    reading: 5.5,
    writing: writingBands.writingOverall,
    speaking: 4.5,
    overall: 6.0,
  },
  skillSummaries: {
    listening:
      "Bạn ở band này có thể hiểu được phần lớn từ vựng trong nhiều chủ đề, bao gồm các thuật ngữ học thuật trong tiếng Anh, kể cả khi bài nói có tốc độ nhanh và phức tạp.",
    reading:
      "Bạn có khả năng xử lý các văn bản học thuật và bài viết nêu quan điểm cá nhân ở mức cơ bản. Bạn hiểu được từ vựng khi các ý tưởng đơn giản.",
    speaking:
      "Bạn có thể duy trì hội thoại nhưng đôi khi mất mạch lạc; cần mở rộng ý và cải thiện phát âm.",
  },
  listeningLink: "https://docs.google.com/document/d/example-student-listening-test",
  readingLink: "https://docs.google.com/document/d/example-student-reading-test",
  writingCriteria: DEFAULT_WRITING_CRITERIA,
  writingSummary: {
    task1:
      "Bạn đáp ứng cơ bản yêu cầu đề bài, có overview phù hợp nhưng đôi khi thiếu chi tiết hoặc chưa chính xác hoàn toàn.",
    task2:
      "Bạn trình bày quan điểm và triển khai ý tương đối rõ, tuy nhiên luận điểm đôi khi chưa sắc sảo.",
  },
  writingLinks: {
    task1: "https://docs.google.com/document/d/example-student-writing-task1",
    task2: "https://docs.google.com/document/d/example-student-writing-task2",
  },
  speakingCriteria: {
    fluencyCoherence: 5.5,
    lexicalResource: 4.0,
    grammaticalRangeAccuracy: 4.0,
    pronunciation: 5.5,
  },
  bcbListening: GUEST_BCB_LISTENING.map((r) => ({ ...r })),
  bcbReading: GUEST_BCB_READING.map((r) => ({ ...r })),
  bcbGrammar: GUEST_BCB_GRAMMAR.map((r) => ({ ...r })),
  updatedAt: new Date().toISOString(),
};

const LEGACY_STORAGE_KEY = "xalo.student.diagnosis.v1";
const STORAGE_KEY = "xalo.student.diagnosis.v2";
export const STUDENT_DIAGNOSIS_UPDATE_EVENT = "xalo-student-diagnosis-updated";

type DiagnosisMap = Record<string, StudentDiagnosisRecord>;

const cacheByStudent = new Map<string, StudentDiagnosisRecord>();

function dispatchUpdate(studentId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(STUDENT_DIAGNOSIS_UPDATE_EVENT, { detail: { studentId } }),
  );
}

function recomputeWritingScore(record: StudentDiagnosisRecord): StudentDiagnosisRecord {
  const bands = resolveWritingBands(record.writingCriteria);
  const scores = { ...record.scores, writing: bands.writingOverall };
  return { ...record, scores };
}

function computeOverall(scores: Omit<SkillScores, "overall">): number {
  const avg =
    (scores.listening + scores.reading + scores.writing + scores.speaking) / 4;
  return Math.round(avg * 2) / 2;
}

function buildDefaultDiagnosis(studentId: string): StudentDiagnosisRecord {
  const base = structuredClone(DEFAULT_STUDENT_DIAGNOSIS);
  const rosterScores = studentScores[studentId];
  if (rosterScores) {
    const partial = {
      listening: rosterScores.listening,
      reading: rosterScores.reading,
      writing: rosterScores.writing,
      speaking: rosterScores.speaking,
    };
    base.scores = {
      ...partial,
      writing: rosterScores.writing,
      overall: computeOverall(partial),
    };
  }
  return recomputeWritingScore(base);
}

function mergeDiagnosis(
  data: Partial<StudentDiagnosisRecord>,
  studentId: string,
): StudentDiagnosisRecord {
  const defaults = buildDefaultDiagnosis(studentId);
  const merged: StudentDiagnosisRecord = {
    ...defaults,
    ...data,
    bcbLink: data.bcbLink !== undefined ? data.bcbLink : defaults.bcbLink,
    scores: { ...defaults.scores, ...data.scores },
    skillSummaries: {
      ...defaults.skillSummaries,
      ...data.skillSummaries,
    },
    writingCriteria: data.writingCriteria ?? defaults.writingCriteria,
    writingSummary: {
      ...defaults.writingSummary,
      ...data.writingSummary,
    },
    writingLinks: {
      ...defaults.writingLinks,
      ...data.writingLinks,
    },
    speakingCriteria: {
      ...defaults.speakingCriteria,
      ...data.speakingCriteria,
    },
    bcbListening: data.bcbListening?.length ? data.bcbListening : defaults.bcbListening,
    bcbReading: data.bcbReading?.length ? data.bcbReading : defaults.bcbReading,
    bcbGrammar: data.bcbGrammar?.length ? data.bcbGrammar : defaults.bcbGrammar,
    updatedAt: data.updatedAt ?? defaults.updatedAt,
  };
  return recomputeWritingScore(merged);
}

function migrateLegacyDiagnosis(): DiagnosisMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Partial<StudentDiagnosisRecord>;
    const migrated = {
      [DEFAULT_STUDENT_ID]: mergeDiagnosis(data, DEFAULT_STUDENT_ID),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return {};
  }
}

function loadAllDiagnoses(): DiagnosisMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyDiagnosis();
    return JSON.parse(raw) as DiagnosisMap;
  } catch {
    return migrateLegacyDiagnosis();
  }
}

export function getStudentDiagnosis(studentId?: string): StudentDiagnosisRecord {
  const id = studentId ?? resolveActiveStudentId();
  if (typeof window !== "undefined") {
    const all = loadAllDiagnoses();
    const record = all[id] ?? buildDefaultDiagnosis(id);
    cacheByStudent.set(id, record);
    return record;
  }
  return cacheByStudent.get(id) ?? buildDefaultDiagnosis(id);
}

export function getStudentWritingBands(
  record?: StudentDiagnosisRecord,
  studentId?: string,
) {
  return resolveWritingBands((record ?? getStudentDiagnosis(studentId)).writingCriteria);
}

export function saveStudentDiagnosis(
  next: Omit<StudentDiagnosisRecord, "updatedAt">,
  studentId?: string,
): StudentDiagnosisRecord {
  const id = studentId ?? resolveActiveStudentId();
  const saved = recomputeWritingScore({
    ...mergeDiagnosis(next, id),
    updatedAt: new Date().toISOString(),
  });
  cacheByStudent.set(id, saved);
  if (typeof window !== "undefined") {
    const all = loadAllDiagnoses();
    all[id] = saved;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    dispatchUpdate(id);
  }
  return saved;
}

export function refreshStudentDiagnosis(studentId?: string): StudentDiagnosisRecord {
  const id = studentId ?? resolveActiveStudentId();
  if (typeof window !== "undefined") {
    const all = loadAllDiagnoses();
    const record = all[id] ?? buildDefaultDiagnosis(id);
    cacheByStudent.set(id, record);
    dispatchUpdate(id);
    return record;
  }
  return getStudentDiagnosis(id);
}

