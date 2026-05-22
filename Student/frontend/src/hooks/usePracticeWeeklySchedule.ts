"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPracticeWeekRangeLabel,
  getPracticeWeeklySchedule,
  PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT,
  type PracticeClassSlot,
} from "@/lib/practiceClass";

export function usePracticeWeeklySchedule() {
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) bump();
    });
    window.addEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      cancelled = true;
      window.removeEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, [bump]);

  const slots = useMemo(() => getPracticeWeeklySchedule(), [version]);
  const weekRangeLabel = useMemo(() => getPracticeWeekRangeLabel(), [version]);

  return { slots, weekRangeLabel };
}
