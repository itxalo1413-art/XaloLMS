"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getStudentDiagnosis,
  getStudentWritingBands,
  refreshStudentDiagnosis,
  STUDENT_DIAGNOSIS_UPDATE_EVENT,
  type StudentDiagnosisRecord,
} from "@/lib/studentDiagnosisStore";
import { resolveActiveStudentId } from "@/lib/studentRoster";

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
