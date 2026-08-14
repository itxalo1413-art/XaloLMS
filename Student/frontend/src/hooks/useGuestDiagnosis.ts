"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGuestDiagnosis,
  getGuestWritingBands,
  GUEST_DIAGNOSIS_UPDATE_EVENT,
  refreshGuestDiagnosis,
  saveGuestDiagnosis,
  type GuestDiagnosisRecord,
} from "@/lib/guestDiagnosisStore";
import { fetchAcaStudents } from "@/lib/acaManagementApi";

export function useGuestDiagnosis() {
  const [diagnosis, setDiagnosis] = useState<GuestDiagnosisRecord>(() => getGuestDiagnosis());

  const sync = useCallback(() => {
    setDiagnosis(getGuestDiagnosis());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(GUEST_DIAGNOSIS_UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(GUEST_DIAGNOSIS_UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  useEffect(() => {
    let alive = true;
    void fetchAcaStudents()
      .then((students) => {
        if (!alive || !students || students.length === 0) return;
        const current = getGuestDiagnosis();
        const match = students.find(
          (s) =>
            (s.email && s.email.toLowerCase().trim() === current.email.toLowerCase().trim()) ||
            (s.name && s.name.toLowerCase().trim() === current.name.toLowerCase().trim())
        );
        if (match && match.scores) {
          const parseScore = (val: number | string | undefined, fallback: number) => {
            if (val === undefined || val === null || val === "-") return fallback;
            const num = parseFloat(String(val));
            return isNaN(num) ? fallback : num;
          };

          const updatedScores = {
            listening: parseScore(match.scores.l, current.scores.listening),
            reading: parseScore(match.scores.r, current.scores.reading),
            writing: parseScore(match.scores.w, current.scores.writing),
            speaking: parseScore(match.scores.s, current.scores.speaking),
            overall: parseScore(match.scores.o, current.scores.overall),
          };

          saveGuestDiagnosis({
            ...current,
            scores: updatedScores,
          });
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  const writingBands = getGuestWritingBands(diagnosis);

  return { diagnosis, writingBands, refresh: () => refreshGuestDiagnosis() };
}
