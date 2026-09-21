"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_STUDENT_DIAGNOSIS,
  getStudentDiagnosis,
  getStudentWritingBands,
  refreshStudentDiagnosis,
  saveStudentDiagnosis,
  STUDENT_DIAGNOSIS_UPDATE_EVENT,
  hasSpeakingBcb,
  hasWritingBcb,
  unwrapDiagnosisApiResponse,
  type StudentDiagnosisRecord,
} from "@/lib/studentDiagnosisStore";
import { resolveActiveStudentId } from "@/lib/studentRoster";
import { fetchLiveStudentDiagnosis } from "@/lib/studentDiagnosisApi";
import { getAuthToken } from "@/lib/auth";

function parseSkillScores(src?: Record<string, unknown> | null): {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
} {
  const band = (v: unknown) => {
    if (v === undefined || v === null || v === "" || v === "-") return 0;
    const n = typeof v === "number" ? v : Number.parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  if (!src) {
    return { listening: 0, reading: 0, writing: 0, speaking: 0, overall: 0 };
  }
  return {
    listening: band(src.listening ?? src.l),
    reading: band(src.reading ?? src.r),
    writing: band(src.writing ?? src.w),
    speaking: band(src.speaking ?? src.s),
    overall: band(src.overall ?? src.o),
  };
}

function hasAnyScore(scores: {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
}) {
  return (
    scores.listening > 0 ||
    scores.reading > 0 ||
    scores.writing > 0 ||
    scores.speaking > 0 ||
    scores.overall > 0
  );
}

export function useStudentDiagnosis(studentId?: string) {
  const activeId = studentId ?? resolveActiveStudentId();
  const [diagnosis, setDiagnosis] = useState<StudentDiagnosisRecord>(() =>
    getStudentDiagnosis(activeId),
  );

  const sync = useCallback(() => {
    setDiagnosis(getStudentDiagnosis(activeId));
  }, [activeId]);

  useEffect(() => {
    sync();
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ studentId?: string }>).detail;
      if (!detail?.studentId || detail.studentId === activeId) sync();
    };
    window.addEventListener(STUDENT_DIAGNOSIS_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_DIAGNOSIS_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", sync);
    };
  }, [sync, activeId]);

  useEffect(() => {
    if (!activeId || !getAuthToken()) return;
    let alive = true;
    void fetchLiveStudentDiagnosis()
      .then((live) => {
        if (!alive || !live) return;
        const current = getStudentDiagnosis(activeId);
        const fromData = unwrapDiagnosisApiResponse(
          live as unknown as Record<string, unknown>,
        );
        const nextScores = parseSkillScores(
          live.scores as unknown as Record<string, unknown>,
        );
        const dataScores = parseSkillScores(
          fromData.scores as Record<string, unknown> | undefined,
        );

        const scores = hasAnyScore(nextScores)
          ? nextScores
          : hasAnyScore(dataScores)
            ? dataScores
            : EMPTY_STUDENT_DIAGNOSIS.scores;
        const liveFinal = parseSkillScores(
          live.finalScores as unknown as Record<string, unknown>,
        );
        const dataFinal = parseSkillScores(
          fromData.finalScores as Record<string, unknown> | undefined,
        );
        const finalScores = hasAnyScore(liveFinal)
          ? liveFinal
          : hasAnyScore(dataFinal)
            ? dataFinal
            : current.finalScores || EMPTY_STUDENT_DIAGNOSIS.finalScores;

        saveStudentDiagnosis(
          {
            ...EMPTY_STUDENT_DIAGNOSIS,
            ...fromData,
            studentName: live.name || fromData.studentName || "",
            studentEmail: live.email || fromData.studentEmail || "",
            studentPhone: live.phone || fromData.studentPhone || "",
            aim: String(fromData.aim || live.aim || "").trim(),
            examDate:
              live.examDate || fromData.examDate || current.examDate || "",
            examCountdownAnchor: String(
              fromData.examCountdownAnchor || live.examCountdownAnchor || "",
            ).trim(),
            bcbOverviewTitle:
              String(fromData.bcbOverviewTitle || "").trim() ||
              current.bcbOverviewTitle,
            bcbOverviewSummary:
              String(fromData.bcbOverviewSummary || "").trim() ||
              current.bcbOverviewSummary,
            scores,
            finalScores,
            scoreHistory: live.scoreHistory || (fromData as any).scoreHistory || current.scoreHistory || [],
            writingCriteria: hasWritingBcb(fromData)
              ? fromData.writingCriteria!
              : hasWritingBcb(current)
                ? current.writingCriteria
                : EMPTY_STUDENT_DIAGNOSIS.writingCriteria,
            writingSummary: hasWritingBcb(fromData)
              ? fromData.writingSummary!
              : hasWritingBcb(current)
                ? current.writingSummary
                : EMPTY_STUDENT_DIAGNOSIS.writingSummary,
            speakingCriteria: hasSpeakingBcb(fromData)
              ? fromData.speakingCriteria!
              : hasSpeakingBcb(current)
                ? current.speakingCriteria
                : EMPTY_STUDENT_DIAGNOSIS.speakingCriteria,
            bcbListening:
              fromData.bcbListening?.length
                ? fromData.bcbListening
                : current.bcbListening?.length
                  ? current.bcbListening
                  : EMPTY_STUDENT_DIAGNOSIS.bcbListening,
            bcbReading:
              fromData.bcbReading?.length
                ? fromData.bcbReading
                : current.bcbReading?.length
                  ? current.bcbReading
                  : EMPTY_STUDENT_DIAGNOSIS.bcbReading,
            skillSummaries: {
              ...EMPTY_STUDENT_DIAGNOSIS.skillSummaries,
              ...current.skillSummaries,
              ...fromData.skillSummaries,
              listening:
                String(fromData.skillSummaries?.listening || "").trim() ||
                current.skillSummaries.listening,
              reading:
                String(fromData.skillSummaries?.reading || "").trim() ||
                current.skillSummaries.reading,
              speaking:
                String(fromData.skillSummaries?.speaking || "").trim() ||
                current.skillSummaries.speaking,
            },
          },
          activeId,
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [activeId]);

  const writingBands = useMemo(
    () => getStudentWritingBands(diagnosis, activeId),
    [diagnosis, activeId],
  );

  return {
    studentId: activeId,
    diagnosis,
    writingBands,
    refresh: () => refreshStudentDiagnosis(activeId),
  };
}
