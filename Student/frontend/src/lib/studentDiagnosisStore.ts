import type { BcbQuestionTypeRow } from "@/lib/guestBcbDiagnosis";
import {
  GUEST_BCB_LISTENING,
  GUEST_BCB_READING,
} from "@/lib/guestBcbDiagnosis";
import type { SpeakingCriterionScores } from "@/lib/speakingBandDescriptors";
import { DEFAULT_STUDENT_ID } from "@/lib/studentIds";
import { resolveActiveStudentId } from "@/lib/studentRoster";
import { resolveWritingBands, type WritingCriterionInput } from "@/lib/writingScore";
import {
  fetchStudentDiagnosisForAca,
  saveStudentDiagnosisForAca,
} from "@/lib/acaManagementApi";

export type SkillScores = {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
};

export type StudentDiagnosisRecord = {
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  aim: string;
  examDate: string;
  /** Mốc tính “Còn X ngày” (YYYY-MM-DD). Nếu có thì không dùng ngày máy. */
  examCountdownAnchor?: string;
  bcbOverviewTitle: string;
  bcbOverviewSummary: string;
  scores: SkillScores;
  finalScores?: SkillScores;
  skillSummaries: {
    listening: string;
    reading: string;
    speaking: string;
  };
  writingCriteria: WritingCriterionInput;
  writingSummary: { task1: string; task2: string };
  writingLinks: { task1: string; task2: string };
  speakingCriteria: SpeakingCriterionScores;
  bcbListening: BcbQuestionTypeRow[];
  bcbReading: BcbQuestionTypeRow[];
  updatedAt: string;
};

const TEMPLATE_WRITING_CRITERIA: WritingCriterionInput = {
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

const EMPTY_WRITING_CRITERIA: WritingCriterionInput = {
  task1: {
    taskAchievement: 0,
    coherenceCohesion: 0,
    lexicalResource: 0,
    grammaticalRange: 0,
  },
  task2: {
    taskResponse: 0,
    coherenceCohesion: 0,
    lexicalResource: 0,
    grammaticalRange: 0,
  },
};

const templateWritingBands = resolveWritingBands(TEMPLATE_WRITING_CRITERIA);

/** Template cho form ACA khi soạn BCB mới — không dùng làm dữ liệu học viên. */
export const DEFAULT_STUDENT_DIAGNOSIS: StudentDiagnosisRecord = {
  aim: "7.5",
  examDate: "",
  bcbOverviewTitle: "Người dùng Khá (Competent)",
  bcbOverviewSummary:
    "Sử dụng ngôn ngữ hiệu quả, thỉnh thoảng có lỗi dùng từ chưa phù hợp. Đã bắt đầu hiểu được ngôn ngữ phức tạp nhưng phong độ chưa đều giữa các kỹ năng.",
  scores: {
    listening: 7.5,
    reading: 5.5,
    writing: templateWritingBands.writingOverall,
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
  writingCriteria: TEMPLATE_WRITING_CRITERIA,
  writingSummary: {
    task1:
      "Bạn đáp ứng cơ bản yêu cầu đề bài, có overview phù hợp nhưng đôi khi thiếu chi tiết hoặc chưa chính xác hoàn toàn.",
    task2:
      "Bạn trình bày quan điểm và triển khai ý tương đối rõ, tuy nhiên luận điểm đôi khi chưa sắc sảo.",
  },
  writingLinks: {
    task1: "",
    task2: "",
  },
  speakingCriteria: {
    fluencyCoherence: 5.5,
    lexicalResource: 4.0,
    grammaticalRangeAccuracy: 4.0,
    pronunciation: 5.5,
  },
  bcbListening: GUEST_BCB_LISTENING.map((r) => ({ ...r })),
  bcbReading: GUEST_BCB_READING.map((r) => ({ ...r })),
  updatedAt: new Date().toISOString(),
};

/** Trạng thái trống khi học viên chưa có BCB — không seed điểm/mô tả giả. */
export const EMPTY_STUDENT_DIAGNOSIS: StudentDiagnosisRecord = {
  studentName: "",
  studentEmail: "",
  studentPhone: "",
  aim: "",
  examDate: "",
  bcbOverviewTitle: "",
  bcbOverviewSummary: "",
  scores: {
    listening: 0,
    reading: 0,
    writing: 0,
    speaking: 0,
    overall: 0,
  },
  finalScores: {
    listening: 0,
    reading: 0,
    writing: 0,
    speaking: 0,
    overall: 0,
  },
  skillSummaries: {
    listening: "",
    reading: "",
    speaking: "",
  },
  writingCriteria: EMPTY_WRITING_CRITERIA,
  writingSummary: { task1: "", task2: "" },
  writingLinks: { task1: "", task2: "" },
  speakingCriteria: {
    fluencyCoherence: 0,
    lexicalResource: 0,
    grammaticalRangeAccuracy: 0,
    pronunciation: 0,
  },
  bcbListening: [],
  bcbReading: [],
  updatedAt: new Date().toISOString(),
};

const EMPTY_FINAL_SCORES: SkillScores = {
  listening: 0,
  reading: 0,
  writing: 0,
  speaking: 0,
  overall: 0,
};

const LEGACY_STORAGE_KEY = "xalo.student.diagnosis.v1";
/** v3: bỏ seed mock local từ v2. */
const STORAGE_KEY = "xalo.student.diagnosis.v4";
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
  // Giữ điểm Writing Sale/API nếu đã có — không thay bằng công thức criteria.
  if ((record.scores?.writing || 0) > 0) {
    return record;
  }
  const bands = resolveWritingBands(record.writingCriteria);
  if (bands.writingOverall <= 0 && bands.task1Band <= 0 && bands.task2Band <= 0) {
    return record;
  }
  const scores = { ...record.scores, writing: bands.writingOverall };
  return { ...record, scores };
}

function computeOverall(scores: Omit<SkillScores, "overall">): number {
  const avg =
    (scores.listening + scores.reading + scores.writing + scores.speaking) / 4;
  return Math.round(avg * 2) / 2;
}

const dynamicScoresCache = new Map<string, SkillScores>();

export function registerDynamicStudentScores(studentId: string, rawScores: any) {
  if (!studentId || !rawScores) return;
  const l = Number(rawScores.l) || 0;
  const r = Number(rawScores.r) || 0;
  const w = Number(rawScores.w) || 0;
  const s = Number(rawScores.s) || 0;
  const o = Number(rawScores.o) || computeOverall({ listening: l, reading: r, writing: w, speaking: s });

  dynamicScoresCache.set(studentId, { listening: l, reading: r, writing: w, speaking: s, overall: o });
}

function buildEmptyDiagnosis(studentId: string): StudentDiagnosisRecord {
  const base = structuredClone(EMPTY_STUDENT_DIAGNOSIS);
  const dynamic = dynamicScoresCache.get(studentId);

  if (dynamic) {
    base.scores = { ...dynamic };
  }
  return recomputeWritingScore(base);
}

function mergeDiagnosis(
  data: Partial<StudentDiagnosisRecord>,
  studentId: string,
): StudentDiagnosisRecord {
  const defaults = buildEmptyDiagnosis(studentId);
  const merged: StudentDiagnosisRecord = {
    ...defaults,
    ...data,
    examDate: String(data.examDate || "").trim() || defaults.examDate,
    bcbOverviewTitle:
      String(data.bcbOverviewTitle || "").trim() || defaults.bcbOverviewTitle,
    bcbOverviewSummary:
      String(data.bcbOverviewSummary || "").trim() || defaults.bcbOverviewSummary,
    scores: { ...defaults.scores, ...data.scores },
    finalScores: { ...EMPTY_FINAL_SCORES, ...defaults.finalScores, ...data.finalScores },
    skillSummaries: {
      ...defaults.skillSummaries,
      ...data.skillSummaries,
    },
    writingCriteria: {
      task1: {
        ...defaults.writingCriteria.task1,
        ...(data.writingCriteria?.task1 || {}),
      },
      task2: {
        ...defaults.writingCriteria.task2,
        ...(data.writingCriteria?.task2 || {}),
      },
    },
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
    const record = all[id] ?? buildEmptyDiagnosis(id);
    cacheByStudent.set(id, record);
    return record;
  }
  return cacheByStudent.get(id) ?? buildEmptyDiagnosis(id);
}

export function getStudentWritingBands(
  record?: StudentDiagnosisRecord,
  studentId?: string,
) {
  return resolveWritingBands((record ?? getStudentDiagnosis(studentId)).writingCriteria);
}

export function saveStudentDiagnosis(
  next: Partial<Omit<StudentDiagnosisRecord, "updatedAt">>,
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

const BCB_KEYS = [
  "writingCriteria",
  "writingSummary",
  "speakingCriteria",
  "skillSummaries",
  "writingLinks",
  "bcbListening",
  "bcbReading",
  "bcbOverviewTitle",
  "bcbOverviewSummary",
] as const;

export function hasWritingBcb(data?: Partial<StudentDiagnosisRecord> | null): boolean {
  const ta = Number(data?.writingCriteria?.task1?.taskAchievement || 0);
  const tr = Number(data?.writingCriteria?.task2?.taskResponse || 0);
  const text1 = String(data?.writingSummary?.task1 || "").trim();
  const text2 = String(data?.writingSummary?.task2 || "").trim();
  return ta > 0 || tr > 0 || text1.length > 0 || text2.length > 0;
}

export function hasSpeakingBcb(data?: Partial<StudentDiagnosisRecord> | null): boolean {
  const c = data?.speakingCriteria;
  const scores = [
    Number(c?.fluencyCoherence || 0),
    Number(c?.lexicalResource || 0),
    Number(c?.grammaticalRangeAccuracy || 0),
    Number(c?.pronunciation || 0),
  ];
  const text = String(data?.skillSummaries?.speaking || "").trim();
  return scores.some((n) => n > 0) || text.length > 0;
}

export function hasListeningReadingBcb(
  data?: Partial<StudentDiagnosisRecord> | null,
): boolean {
  const listeningText = String(data?.skillSummaries?.listening || "").trim();
  const readingText = String(data?.skillSummaries?.reading || "").trim();
  const hasListeningRows = Boolean(data?.bcbListening?.length);
  const hasReadingRows = Boolean(data?.bcbReading?.length);
  return Boolean(listeningText || readingText || hasListeningRows || hasReadingRows);
}

export function unwrapDiagnosisApiResponse(
  remote: Record<string, unknown>,
): Partial<StudentDiagnosisRecord> {
  const nested =
    remote.diagnosisData && typeof remote.diagnosisData === "object"
      ? (remote.diagnosisData as Record<string, unknown>)
      : null;
  const payload = {
    ...(nested ? nested : remote),
  } as Partial<StudentDiagnosisRecord> & Record<string, unknown>;
  for (const key of BCB_KEYS) {
    if (payload[key] == null && remote[key] != null) {
      (payload as Record<string, unknown>)[key] = remote[key];
    }
  }
  if (typeof remote.aim === "string" && remote.aim && !payload.aim) {
    payload.aim = remote.aim;
  }
  if (typeof remote.examDate === "string" && remote.examDate && !payload.examDate) {
    payload.examDate = remote.examDate;
  }
  return payload;
}

export async function syncStudentDiagnosisFromApi(
  studentId: string,
  email?: string,
): Promise<StudentDiagnosisRecord> {
  const id = studentId.trim();
  const normalizedEmail = (email || "").trim();
  if (!id && !normalizedEmail) {
    return getStudentDiagnosis(id);
  }

  try {
    const remote = await fetchStudentDiagnosisForAca(normalizedEmail, id);
    if (remote && typeof remote === "object") {
      const payload = unwrapDiagnosisApiResponse(remote as Record<string, unknown>);
      const local = getStudentDiagnosis(id);
      if (!hasWritingBcb(payload) && hasWritingBcb(local)) {
        payload.writingCriteria = local.writingCriteria;
        payload.writingSummary = local.writingSummary;
      }
      if (!hasSpeakingBcb(payload) && hasSpeakingBcb(local)) {
        payload.speakingCriteria = local.speakingCriteria;
        payload.skillSummaries = {
          ...(payload.skillSummaries || local.skillSummaries),
          speaking: local.skillSummaries.speaking,
        };
      }
      if (!hasListeningReadingBcb(payload) && hasListeningReadingBcb(local)) {
        payload.bcbListening = local.bcbListening;
        payload.bcbReading = local.bcbReading;
        payload.skillSummaries = {
          ...(local.skillSummaries || {}),
          ...(payload.skillSummaries || {}),
          listening:
            String(payload.skillSummaries?.listening || "").trim() ||
            local.skillSummaries.listening,
          reading:
            String(payload.skillSummaries?.reading || "").trim() ||
            local.skillSummaries.reading,
        };
      } else {
        payload.skillSummaries = {
          ...(local.skillSummaries || {}),
          ...(payload.skillSummaries || {}),
          listening:
            String(payload.skillSummaries?.listening || "").trim() ||
            local.skillSummaries.listening,
          reading:
            String(payload.skillSummaries?.reading || "").trim() ||
            local.skillSummaries.reading,
          speaking:
            String(payload.skillSummaries?.speaking || "").trim() ||
            local.skillSummaries.speaking,
        };
        if (!payload.bcbListening?.length && local.bcbListening?.length) {
          payload.bcbListening = local.bcbListening;
        }
        if (!payload.bcbReading?.length && local.bcbReading?.length) {
          payload.bcbReading = local.bcbReading;
        }
      }
      if (!String(payload.examDate || "").trim() && local.examDate) {
        payload.examDate = local.examDate;
      }
      if (!String(payload.bcbOverviewTitle || "").trim() && local.bcbOverviewTitle) {
        payload.bcbOverviewTitle = local.bcbOverviewTitle;
      }
      if (!String(payload.bcbOverviewSummary || "").trim() && local.bcbOverviewSummary) {
        payload.bcbOverviewSummary = local.bcbOverviewSummary;
      }
      const merged = mergeDiagnosis(payload, id);
      cacheByStudent.set(id, merged);
      if (typeof window !== "undefined") {
        const all = loadAllDiagnoses();
        all[id] = merged;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        dispatchUpdate(id);
      }
      return merged;
    }
  } catch (err) {
    console.warn("Could not sync student diagnosis from API", err);
  }
  return getStudentDiagnosis(id);
}

export async function persistStudentDiagnosisToApi(
  studentId: string,
  email: string | undefined,
  payload: Partial<Omit<StudentDiagnosisRecord, "updatedAt">>,
): Promise<StudentDiagnosisRecord> {
  const saved = saveStudentDiagnosis(payload, studentId);
  const normalizedEmail = (email || payload.studentEmail || "").trim();
  if (!normalizedEmail && !studentId.trim()) {
    throw new Error("Thiếu email học viên — không lưu được BCB lên server.");
  }
  const payloadToSave = { ...(saved as unknown as Record<string, unknown>) };
  delete payloadToSave.bcbLink;
  delete payloadToSave.listeningLink;
  delete payloadToSave.readingLink;
  delete payloadToSave.bcbGrammar;
  if (payload.studentName) payloadToSave.studentName = payload.studentName;
  if (payload.studentPhone) payloadToSave.studentPhone = payload.studentPhone;
  await saveStudentDiagnosisForAca(normalizedEmail, payloadToSave, studentId);
  return saved;
}

export function refreshStudentDiagnosis(studentId?: string): StudentDiagnosisRecord {
  const id = studentId ?? resolveActiveStudentId();
  if (typeof window !== "undefined") {
    const all = loadAllDiagnoses();
    const record = all[id] ?? buildEmptyDiagnosis(id);
    cacheByStudent.set(id, record);
    dispatchUpdate(id);
    return record;
  }
  return getStudentDiagnosis(id);
}

