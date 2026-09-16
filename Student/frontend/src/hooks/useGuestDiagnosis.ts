"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGuestDiagnosis,
  getGuestWritingBands,
  GUEST_DIAGNOSIS_UPDATE_EVENT,
  refreshGuestDiagnosis,
  type GuestDiagnosisRecord,
} from "@/lib/guestDiagnosisStore";
import { getGuestLeadDiagnosisPublic } from "@/lib/guestDiagnosisLeads";

export function useGuestDiagnosis(leadId?: string | null) {
  const [diagnosis, setDiagnosis] = useState<GuestDiagnosisRecord>(() => getGuestDiagnosis());
  const [loading, setLoading] = useState(Boolean(leadId));
  const [loadError, setLoadError] = useState("");

  const syncLocal = useCallback(() => {
    if (leadId) return;
    setDiagnosis(getGuestDiagnosis());
  }, [leadId]);

  useEffect(() => {
    if (leadId) return;
    syncLocal();
    window.addEventListener(GUEST_DIAGNOSIS_UPDATE_EVENT, syncLocal);
    window.addEventListener("storage", syncLocal);
    return () => {
      window.removeEventListener(GUEST_DIAGNOSIS_UPDATE_EVENT, syncLocal);
      window.removeEventListener("storage", syncLocal);
    };
  }, [leadId, syncLocal]);

  useEffect(() => {
    if (!leadId) {
      setLoading(false);
      setLoadError("");
      setDiagnosis(getGuestDiagnosis());
      return;
    }

    let alive = true;
    setLoading(true);
    setLoadError("");
    void getGuestLeadDiagnosisPublic(leadId)
      .then((row) => {
        if (!alive) return;
        if (!row) {
          setLoadError("Không tìm thấy báo cáo chẩn đoán cho link này.");
          setDiagnosis(getGuestDiagnosis());
          return;
        }
        setDiagnosis(row);
      })
      .catch(() => {
        if (!alive) return;
        setLoadError("Không tải được báo cáo. Thử lại sau.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [leadId]);

  const writingBands = getGuestWritingBands(diagnosis);

  return {
    diagnosis,
    writingBands,
    loading,
    loadError,
    refresh: () => (leadId ? undefined : refreshGuestDiagnosis()),
  };
}
