"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGuestDiagnosis,
  getGuestWritingBands,
  GUEST_DIAGNOSIS_UPDATE_EVENT,
  refreshGuestDiagnosis,
  type GuestDiagnosisRecord,
} from "@/lib/guestDiagnosisStore";

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

  const writingBands = getGuestWritingBands(diagnosis);

  return { diagnosis, writingBands, refresh: () => refreshGuestDiagnosis() };
}
