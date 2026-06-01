"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  findSessionsOnDay,
  getDaysInMonth,
  getPrevMonthPadding,
  getSessionsDayStyle,
  isSessionFuture,
  parseSessionDateString,
  SCHEDULE_MONTH_LABELS,
} from "@/lib/courseSchedule";
import {
  getPracticeSlotById,
  getPracticeSlotsForStudent,
  getRegisteredPracticeSlotsOnCalendarDay,
  hasRegisteredPracticeOnCalendarDay,
  PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT,
  PRACTICE_CLASS_UPDATE_EVENT,
  refreshPracticeRegistrations,
  refreshPracticeScheduleForStudent,
} from "@/lib/practiceClass";
import {
  loadMockTestRequests,
  MOCK_TEST_UPDATE_EVENT,
  refreshMockTestRequestsForStudent,
  type MockTestRequest,
} from "@/lib/mockTestRequests";
import {
  DEFAULT_SCHEDULE_VIEW,
  loadScheduleViewState,
  saveScheduleViewState,
} from "@/lib/scheduleViewState";
import { getStudentIdentity } from "@/lib/studentIdentity";
import {
  refreshRlpSessions,
  RLP_SESSIONS_UPDATE_EVENT,
} from "@/lib/rlpSessionStore";
import { useClientToday } from "@/hooks/useClientToday";

export function useStudentSchedule() {
  const clientToday = useClientToday();
  const [viewState, setViewState] = useState(loadScheduleViewState);
  const [requests, setRequests] = useState<MockTestRequest[]>([]);
  const student = getStudentIdentity();
  const [practiceSlotVersion, setPracticeSlotVersion] = useState(0);
  const [rlpVersion, setRlpVersion] = useState(0);

  const syncRequests = useCallback(() => {
    void refreshMockTestRequestsForStudent(student.id).then((rows) => {
      setRequests(rows);
    });
  }, [student.id]);

  const syncPracticeSlots = useCallback(() => {
    void Promise.all([
      refreshPracticeScheduleForStudent(),
      refreshPracticeRegistrations(student.id),
    ]).finally(() => setPracticeSlotVersion((v) => v + 1));
  }, [student.id]);

  const syncRlp = useCallback(() => {
    void refreshRlpSessions().finally(() => setRlpVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        syncRequests();
        syncPracticeSlots();
        syncRlp();
      }
    });
    window.addEventListener(MOCK_TEST_UPDATE_EVENT, syncRequests);
    window.addEventListener(PRACTICE_CLASS_UPDATE_EVENT, syncPracticeSlots);
    window.addEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, syncPracticeSlots);
    window.addEventListener(RLP_SESSIONS_UPDATE_EVENT, syncRlp);
    window.addEventListener("storage", syncRequests);
    return () => {
      cancelled = true;
      window.removeEventListener(MOCK_TEST_UPDATE_EVENT, syncRequests);
      window.removeEventListener(PRACTICE_CLASS_UPDATE_EVENT, syncPracticeSlots);
      window.removeEventListener(PRACTICE_CLASS_SCHEDULE_UPDATE_EVENT, syncPracticeSlots);
      window.removeEventListener(RLP_SESSIONS_UPDATE_EVENT, syncRlp);
      window.removeEventListener("storage", syncRequests);
    };
  }, [syncRequests, syncPracticeSlots, syncRlp]);

  useEffect(() => {
    saveScheduleViewState(viewState);
  }, [viewState]);

  const viewDate = useMemo(
    () => new Date(viewState.year, viewState.month, 1),
    [viewState.year, viewState.month],
  );

  const setViewDate = useCallback((date: Date) => {
    setViewState((prev) => ({
      ...prev,
      year: date.getFullYear(),
      month: date.getMonth(),
      selectedDay: null,
    }));
  }, []);

  const selectedDay = viewState.selectedDay;
  const setSelectedDay = useCallback((day: number | null) => {
    setViewState((prev) => ({ ...prev, selectedDay: day }));
  }, []);

  const practiceSlotRegistrations = useMemo(
    () => getPracticeSlotsForStudent(student.id),
    [student.id, practiceSlotVersion],
  );

  const myRequests = useMemo(
    () => requests.filter((r) => r.studentId === student.id),
    [requests, student.id],
  );
  const approvedTests = useMemo(
    () => myRequests.filter((r) => r.status === "approved"),
    [myRequests],
  );
  const pendingTests = useMemo(
    () => myRequests.filter((r) => r.status === "pending"),
    [myRequests],
  );

  const changeMonth = useCallback((offset: number) => {
    setViewState((prev) => {
      const next = new Date(prev.year, prev.month + offset, 1);
      return {
        year: next.getFullYear(),
        month: next.getMonth(),
        selectedDay: null,
      };
    });
  }, []);

  const openScheduleForSession = useCallback((dateStr: string) => {
    const parsed = parseSessionDateString(dateStr);
    if (!parsed) return;
    setViewState({
      year: parsed.year,
      month: parsed.month,
      selectedDay: parsed.day,
    });
  }, []);

  const month = viewState.month;
  const year = viewState.year;
  const daysInMonth = getDaysInMonth(month, year);
  const prevMonthPadding = getPrevMonthPadding(month, year);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const approvedEvents = approvedTests
      .filter((t) => t.day === selectedDay && t.month === month && t.year === year)
      .map((t) => ({
        type: "mock" as const,
        label: t.skill,
        detail: `Giờ ${t.examTime ?? "—"} · ${t.examTeacher ?? "GV —"}`,
      }));

    const rlpSessions = findSessionsOnDay(selectedDay, month, year);
    const rlpEvents = rlpSessions.map((s) => ({
      type: "rlp" as const,
      label: `Buổi ${s.no} · ${s.skill}`,
      detail: `${s.date} · ${s.attendance === "absent" ? "Vắng học" : "Đi học"} · ${s.contents.slice(0, 72)}…`,
    }));

    const practiceRegs = getRegisteredPracticeSlotsOnCalendarDay(
      student.id,
      selectedDay,
      month,
      year,
    );
    const practiceEvents = practiceRegs.map((reg) => {
      const slot = getPracticeSlotById(reg.slotId);
      return {
        type: "practice" as const,
        label: slot?.title ?? "Lớp luyện đề",
        detail: slot ? `${slot.dayLabel} · ${slot.time} · ${slot.platform}` : "—",
      };
    });

    return [...rlpEvents, ...practiceEvents, ...approvedEvents];
  }, [approvedTests, month, rlpVersion, selectedDay, student.id, year]);

  return {
    clientToday,
    viewDate,
    setViewDate,
    month,
    year,
    selectedDay,
    setSelectedDay,
    changeMonth,
    openScheduleForSession,
    daysInMonth,
    prevMonthPadding,
    selectedDayEvents,
    studentId: student.id,
    practiceSlotRegistrations,
    hasRegisteredPracticeOnDay: (day: number, m: number, y: number) =>
      hasRegisteredPracticeOnCalendarDay(student.id, day, m, y),
    myRequests,
    approvedTests,
    pendingTests,
    months: SCHEDULE_MONTH_LABELS,
    getSessionsDayStyle: (daySessions: Parameters<typeof getSessionsDayStyle>[0]) =>
      getSessionsDayStyle(daySessions, clientToday),
    isSessionFuture: (session: Parameters<typeof isSessionFuture>[0]) =>
      isSessionFuture(session, clientToday),
    resetView: () => setViewState(DEFAULT_SCHEDULE_VIEW),
  };
}

export type StudentSchedule = ReturnType<typeof useStudentSchedule>;
