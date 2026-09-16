"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPracticeWeekRangeLabel,
  getPracticeWeeklySchedule,
  PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT,
  refreshPracticeCurrentWeek,
  refreshPracticeScheduleForStudent,
} from "@/lib/practiceClass";

export function usePracticeWeeklySchedule() {
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      refreshPracticeScheduleForStudent(),
      refreshPracticeCurrentWeek(),
    ]).then(() => {
      if (!cancelled) bump();
    });
    const onUpdate = () => bump();
    window.addEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, onUpdate);
    };
  }, [bump]);

  const slots = useMemo(() => getPracticeWeeklySchedule(), [version]);
  const weekRangeLabel = useMemo(() => getPracticeWeekRangeLabel(), [version]);

  return { slots, weekRangeLabel, refresh: bump };
}
