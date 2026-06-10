import type { BcbGrammarRow, BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";
import {
  GUEST_BCB_GRAMMAR,
  GUEST_BCB_LISTENING,
  GUEST_BCB_READING,
} from "@/lib/guestBcbDiagnosis";
import type { SpeakingCriterionScores } from "@/lib/speakingBandDescriptors";
import { resolveWritingBands, type WritingCriterionInput } from "@/lib/writingScore";
import type { SkillScores } from "@/lib/studentDiagnosisStore";

export type GuestDiagnosisRecord = {
  name: string;
  email: string;
  phone: string;
  testDate: string;
  aim: string;
  scores: SkillScores;
  writingCriteria: WritingCriterionInput;
  writingSummary: { task1: string; task2: string };
  writingLinks: { task1: string; task2: string };
  listeningLink: string;
  readingLink: string;
  speakingCriteria: SpeakingCriterionScores;
  bcbOverviewTitle: string;
  bcbOverviewSummary: string;
  skillSummaries: { listening: string; reading: string; speaking: string };
  bcbListening: BcbQuestionTypeRow[];
  bcbReading: BcbQuestionTypeRow[];
  bcbGrammar: BcbGrammarRow[];
  updatedAt: string;
};

const DEFAULT_WRITING_CRITERIA: WritingCriterionInput = {
  task1: {
    taskAchievement: 7,
    coherenceCohesion: 7,
    lexicalResource: 7,
    grammaticalRange: 7,
  },
  task2: {
    taskResponse: 7,
    coherenceCohesion: 7,
    lexicalResource: 7,
    grammaticalRange: 7,
  },
};

const guestWritingBands = resolveWritingBands(DEFAULT_WRITING_CRITERIA);

export const DEFAULT_GUEST_DIAGNOSIS: GuestDiagnosisRecord = {
  name: "Dương Ngọc Khôi Nguyên",
  email: "nguyenduong939705@gmail.com",
  phone: "0947 188 794",
  testDate: "26/05/2026",
  aim: "7.5",
  scores: {
    listening: 7.0,
    reading: 5.5,
    writing: guestWritingBands.writingOverall,
    speaking: 4.5,
    overall: 6.0,
  },
  writingCriteria: DEFAULT_WRITING_CRITERIA,
  writingSummary: {
    task1:
      "Bạn đưa ra được thông tin khái quát (Overview) và mô tả các đặc điểm chính của biểu đồ khá rõ.",
    task2:
      "Bạn đưa ra được quan điểm cá nhân rõ ràng. Dùng được tương đối đa dạng từ nối.",
  },
  writingLinks: {
    task1: "https://docs.google.com/document/d/example-guest-writing-task1",
    task2: "https://docs.google.com/document/d/example-guest-writing-task2",
  },
  listeningLink: "https://docs.google.com/document/d/example-guest-listening-test",
  readingLink: "https://docs.google.com/document/d/example-guest-reading-test",
  speakingCriteria: {
    fluencyCoherence: 5.5,
    lexicalResource: 4.0,
    grammaticalRangeAccuracy: 4.0,
    pronunciation: 5.5,
  },
  bcbOverviewTitle: "Người dùng Khá (Competent)",
  bcbOverviewSummary:
    "Sử dụng ngôn ngữ hiệu quả, thỉnh thoảng có lỗi dùng từ chưa phù hợp. Đã bắt đầu hiểu được ngôn ngữ phức tạp nhưng phong độ chưa đều giữa các kỹ năng.",
  skillSummaries: {
    listening:
      "Bạn ở band này có thể hiểu được phần lớn từ vựng trong nhiều chủ đề, bao gồm các thuật ngữ học thuật.",
    reading:
      "Bạn có khả năng xử lý các văn bản học thuật ở mức cơ bản nhưng dễ bị bối rối trước cấu trúc câu phức tạp.",
    speaking: "Bạn có thể duy trì hội thoại nhưng đôi khi mất mạch lạc.",
  },
  bcbListening: GUEST_BCB_LISTENING.map((r) => ({ ...r })),
  bcbReading: GUEST_BCB_READING.map((r) => ({ ...r })),
  bcbGrammar: GUEST_BCB_GRAMMAR.map((r) => ({ ...r })),
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = "xalo.guest.diagnosis.v1";
export const GUEST_DIAGNOSIS_UPDATE_EVENT = "xalo-guest-diagnosis-updated";

let cache: GuestDiagnosisRecord = structuredClone(DEFAULT_GUEST_DIAGNOSIS);

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GUEST_DIAGNOSIS_UPDATE_EVENT));
}

function recomputeWritingScore(record: GuestDiagnosisRecord): GuestDiagnosisRecord {
  const bands = resolveWritingBands(record.writingCriteria);
  return { ...record, scores: { ...record.scores, writing: bands.writingOverall } };
}

function loadLocal(): GuestDiagnosisRecord {
  if (typeof window === "undefined") return structuredClone(DEFAULT_GUEST_DIAGNOSIS);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_GUEST_DIAGNOSIS);
    const data = JSON.parse(raw) as Partial<GuestDiagnosisRecord>;
    const merged: GuestDiagnosisRecord = {
      ...structuredClone(DEFAULT_GUEST_DIAGNOSIS),
      ...data,
      scores: { ...DEFAULT_GUEST_DIAGNOSIS.scores, ...data.scores },
      skillSummaries: {
        ...DEFAULT_GUEST_DIAGNOSIS.skillSummaries,
        ...data.skillSummaries,
      },
      writingCriteria: data.writingCriteria ?? DEFAULT_GUEST_DIAGNOSIS.writingCriteria,
      writingSummary: {
        ...DEFAULT_GUEST_DIAGNOSIS.writingSummary,
        ...data.writingSummary,
      },
      writingLinks: { ...DEFAULT_GUEST_DIAGNOSIS.writingLinks, ...data.writingLinks },
      speakingCriteria: {
        ...DEFAULT_GUEST_DIAGNOSIS.speakingCriteria,
        ...data.speakingCriteria,
      },
      bcbListening: data.bcbListening?.length
        ? data.bcbListening
        : DEFAULT_GUEST_DIAGNOSIS.bcbListening,
      bcbReading: data.bcbReading?.length ? data.bcbReading : DEFAULT_GUEST_DIAGNOSIS.bcbReading,
      bcbGrammar: data.bcbGrammar?.length ? data.bcbGrammar : DEFAULT_GUEST_DIAGNOSIS.bcbGrammar,
      updatedAt: data.updatedAt ?? DEFAULT_GUEST_DIAGNOSIS.updatedAt,
    };
    return recomputeWritingScore(merged);
  } catch {
    return structuredClone(DEFAULT_GUEST_DIAGNOSIS);
  }
}

export function getGuestDiagnosis(): GuestDiagnosisRecord {
  if (typeof window !== "undefined") {
    cache = loadLocal();
  }
  return cache;
}

export function getGuestWritingBands(record = getGuestDiagnosis()) {
  return resolveWritingBands(record.writingCriteria);
}

export function saveGuestDiagnosis(
  next: Omit<GuestDiagnosisRecord, "updatedAt">,
): GuestDiagnosisRecord {
  const saved = recomputeWritingScore({
    ...structuredClone(DEFAULT_GUEST_DIAGNOSIS),
    ...next,
    updatedAt: new Date().toISOString(),
  });
  cache = saved;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    dispatchUpdate();
  }
  return saved;
}

export function refreshGuestDiagnosis(): GuestDiagnosisRecord {
  cache = loadLocal();
  dispatchUpdate();
  return cache;
}

if (typeof window !== "undefined") {
  cache = loadLocal();
}
