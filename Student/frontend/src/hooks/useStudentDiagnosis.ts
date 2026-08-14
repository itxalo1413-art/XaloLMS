"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getStudentDiagnosis,
  getStudentWritingBands,
  refreshStudentDiagnosis,
  saveStudentDiagnosis,
  STUDENT_DIAGNOSIS_UPDATE_EVENT,
  type StudentDiagnosisRecord,
} from "@/lib/studentDiagnosisStore";
import { resolveActiveStudentId } from "@/lib/studentRoster";
import { fetchLiveStudentDiagnosis } from "@/lib/studentDiagnosisApi";
import { fetchAcaStudents } from "@/lib/acaManagementApi";

import { getAuthToken } from "@/lib/auth";

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
        if (!alive || !live || !live.scores) return;
        const current = getStudentDiagnosis(activeId);
        const nextScores = {
          listening: Number(live.scores?.listening) || current.scores?.listening || 0,
          reading: Number(live.scores?.reading) || current.scores?.reading || 0,
          writing: Number(live.scores?.writing) || current.scores?.writing || 0,
          speaking: Number(live.scores?.speaking) || current.scores?.speaking || 0,
          overall: Number(live.scores?.overall) || current.scores?.overall || 0,
        };

        saveStudentDiagnosis({
          ...current,
          bcbLink: live.bcbLink || current.bcbLink || "",
          scores: nextScores,
        }, activeId);
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
