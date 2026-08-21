import {
  ENTRANCE_BCB_GRAMMAR,
  ENTRANCE_BCB_LISTENING,
  ENTRANCE_BCB_READING,
  computeBcbErrorRate,
  type BcbGrammarRow,
  type BcbQuestionTypeRow,
} from "@/lib/guestBcbDiagnosis";
import type { GuestDiagnosisRecord } from "@/lib/guestDiagnosisStore";
import type { GuestDiagnosisLead } from "@/lib/guestDiagnosisLeads";
import { resolveWritingBands } from "@/lib/writingScore";

export type LeadDiagnosisRecord = GuestDiagnosisRecord & {
  listeningCorrect: number;
  listeningTotal: number;
  readingCorrect: number;
  readingTotal: number;
};

function cloneRows<T>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r }));
}

export function emptyLeadDiagnosis(lead: GuestDiagnosisLead): LeadDiagnosisRecord {
  return {
    name: lead.name,
    email: "",
    phone: lead.phone,
    testDate: "",
    aim: lead.aim,
    scores: { listening: 0, reading: 0, writing: 0, speaking: 0, overall: 0 },
    writingCriteria: {
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
    },
    writingSummary: { task1: "", task2: "" },
    writingLinks: { task1: "", task2: "" },
    listeningLink: "",
    readingLink: "",
    speakingCriteria: {
      fluencyCoherence: 0,
      lexicalResource: 0,
      grammaticalRangeAccuracy: 0,
      pronunciation: 0,
    },
    bcbOverviewTitle: "",
    bcbOverviewSummary: "",
    skillSummaries: { listening: "", reading: "", speaking: "" },
    bcbListening: cloneRows(ENTRANCE_BCB_LISTENING),
    bcbReading: cloneRows(ENTRANCE_BCB_READING),
    bcbGrammar: cloneRows(ENTRANCE_BCB_GRAMMAR),
    listeningCorrect: 0,
    listeningTotal: 40,
    readingCorrect: 0,
    readingTotal: 40,
    updatedAt: new Date().toISOString(),
  };
}

function mergeQuestionRows(
  saved: BcbQuestionTypeRow[] | undefined,
  fallback: BcbQuestionTypeRow[],
): BcbQuestionTypeRow[] {
  if (!saved?.length) return cloneRows(fallback);
  const byId = new Map(saved.map((r) => [r.id, r]));
  return fallback.map((base) => {
    const hit = byId.get(base.id);
    if (!hit) return { ...base };
    const merged = { ...base, ...hit };
    merged.errorRate = computeBcbErrorRate(merged.correct, merged.total, merged.errorRate ?? 0);
    return merged;
  });
}

function mergeGrammarRows(
  saved: BcbGrammarRow[] | undefined,
  fallback: BcbGrammarRow[],
): BcbGrammarRow[] {
  if (!saved?.length) return cloneRows(fallback);
  const byId = new Map(saved.map((r) => [r.id, r]));
  return fallback.map((base) => ({ ...base, ...(byId.get(base.id) ?? {}) }));
}

export function normalizeLeadDiagnosis(
  lead: GuestDiagnosisLead,
  raw?: Partial<LeadDiagnosisRecord> | null,
): LeadDiagnosisRecord {
  const base = emptyLeadDiagnosis(lead);
  if (!raw) return base;
  const writingCriteria = raw.writingCriteria ?? base.writingCriteria;
  const bands = resolveWritingBands(writingCriteria);
  const scores = {
    ...base.scores,
    ...raw.scores,
    writing: raw.scores?.writing || bands.writingOverall,
  };
  const avg = (scores.listening + scores.reading + scores.writing + scores.speaking) / 4;
  scores.overall = scores.overall || Math.round(avg * 2) / 2;
  return {
    ...base,
    ...raw,
    name: raw.name || lead.name,
    phone: raw.phone || lead.phone,
    aim: raw.aim || lead.aim,
    scores,
    writingCriteria,
    writingSummary: { ...base.writingSummary, ...raw.writingSummary },
    writingLinks: { ...base.writingLinks, ...raw.writingLinks },
    skillSummaries: { ...base.skillSummaries, ...raw.skillSummaries },
    speakingCriteria: { ...base.speakingCriteria, ...raw.speakingCriteria },
    bcbListening: mergeQuestionRows(raw.bcbListening, ENTRANCE_BCB_LISTENING),
    bcbReading: mergeQuestionRows(raw.bcbReading, ENTRANCE_BCB_READING),
    bcbGrammar: mergeGrammarRows(raw.bcbGrammar, ENTRANCE_BCB_GRAMMAR),
    listeningCorrect: Number(raw.listeningCorrect) || 0,
    listeningTotal: Number(raw.listeningTotal) || 40,
    readingCorrect: Number(raw.readingCorrect) || 0,
    readingTotal: Number(raw.readingTotal) || 40,
  };
}

export function sumCorrect(rows: BcbQuestionTypeRow[]): { correct: number; total: number } {
  return rows.reduce(
    (acc, r) => ({
      correct: acc.correct + (Number(r.correct) || 0),
      total: acc.total + (Number(r.total) || 0),
    }),
    { correct: 0, total: 0 },
  );
}
