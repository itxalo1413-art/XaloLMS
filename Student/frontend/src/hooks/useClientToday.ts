"use client";

import { useEffect, useState } from "react";

export type ClientToday = {
  date: number;
  month: number;
  year: number;
};

/** Returns null until after mount so SSR and hydration markup stay aligned. */
export function useClientToday(): ClientToday | null {
  const [today, setToday] = useState<ClientToday | null>(null);

  useEffect(() => {
    const now = new Date();
    setToday({
      date: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
    });
  }, []);

  return today;
}

export function isSameCalendarDay(
  today: ClientToday | null,
  day: number,
  month: number,
  year: number,
) {
  if (!today) return false;
  return today.date === day && today.month === month && today.year === year;
}
