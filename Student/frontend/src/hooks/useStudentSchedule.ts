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
import { getGraderMeetLink, GRADER_MEET_LINKS_EVENT } from "@/lib/graderMeetLinks";
import {
  DEFAULT_SCHEDULE_VIEW,
  loadScheduleViewState,
  saveScheduleViewState,
} from "@/lib/scheduleViewState";
import { getStudentIdentity } from "@/lib/studentIdentity";
import {
  getCourseRlpSessions,
  refreshRlpSessions,
  RLP_SESSIONS_UPDATE_EVENT,
} from "@/lib/rlpSessionStore";
import { useClientToday } from "@/hooks/useClientToday";
import { getCachedAuthUser } from "@/lib/auth";

export function useStudentSchedule() {
  const clientToday = useClientToday();
  const [viewState, setViewState] = useState(loadScheduleViewState);
  const [requests, setRequests] = useState<MockTestRequest[]>([]);
  const student = getStudentIdentity();
  const [practiceSlotVersion, setPracticeSlotVersion] = useState(0);
  const [rlpVersion, setRlpVersion] = useState(0);

  const syncRequests = useCallback(() => {
    void refreshMockTestRequestsForStudent(student.id)
      .then((rows) => {
        setRequests(rows);
      })
      .catch((err) => {
        console.warn("Could not sync mock test requests", err);
        setRequests(loadMockTestRequests());
      });
  }, [student.id]);

  const syncPracticeSlots = useCallback(() => {
    void Promise.all([
      refreshPracticeScheduleForStudent(),
      refreshPracticeRegistrations(student.id),
    ]).finally(() => setPracticeSlotVersion((v) => v + 1));
  }, [student.id]);

  const syncRlp = useCallback(() => {
    void refreshRlpSessions()
      .catch((err) => {
        console.warn("Could not sync RLP sessions", err);
      })
      .finally(() => setRlpVersion((v) => v + 1));
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasUserSavedState = Boolean(sessionStorage.getItem("xalo.student.scheduleView.v1"));
    if (hasUserSavedState) return;

    const sessions = getCourseRlpSessions();
    if (!sessions.length) return;

    const currentMonthHasSessions = sessions.some((s) => {
      const p = parseSessionDateString(s.date);
      return p && p.month === viewState.month && p.year === viewState.year;
    });

    if (!currentMonthHasSessions) {
      let nearestMonth = viewState.month;
      let nearestYear = viewState.year;
      let minDiff = Infinity;
      const nowTime = new Date().getTime();

      for (const s of sessions) {
        const p = parseSessionDateString(s.date);
        if (p) {
          const sTime = new Date(p.year, p.month, p.day).getTime();
          const diff = Math.abs(nowTime - sTime);
          if (diff < minDiff) {
            minDiff = diff;
            nearestMonth = p.month;
            nearestYear = p.year;
          }
        }
      }

      if (nearestMonth !== viewState.month || nearestYear !== viewState.year) {
        setViewState({ year: nearestYear, month: nearestMonth, selectedDay: null });
      }
    }
  }, [rlpVersion, viewState.month, viewState.year]);

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

  const myRequests = useMemo(() => {
    const user = getCachedAuthUser();
    return requests.filter(
      (r) =>
        r.studentId === student.id ||
        (user?.id && r.studentId === user.id) ||
        (user?.name && r.studentName === user.name),
    );
  }, [requests, student.id]);
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

  const [meetLinksVersion, setMeetLinksVersion] = useState(0);

  useEffect(() => {
    const onMeetUpdate = () => setMeetLinksVersion((v) => v + 1);
    window.addEventListener(GRADER_MEET_LINKS_EVENT, onMeetUpdate);
    return () => window.removeEventListener(GRADER_MEET_LINKS_EVENT, onMeetUpdate);
  }, []);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const approvedEvents = approvedTests
      .filter((t) => t.day === selectedDay && t.month === month && t.year === year)
      .map((t) => ({
        type: "mock" as const,
        label: t.skill,
        detail: `Giờ ${t.examTime ?? "—"} · ${t.examTeacher ?? "GV —"}`,
        meetLink: getGraderMeetLink(t.examTeacher),
      }));

    const rlpSessions = findSessionsOnDay(selectedDay, month, year);
    const rlpEvents = rlpSessions.map((s) => ({
      type: "rlp" as const,
      label: `Buổi ${s.no} · ${s.skill}`,
      detail: `${s.date} · ${s.attendance === "absent" ? "Vắng học" : "Đi học"} · ${s.contents.slice(0, 72)}…`,
      meetLink: undefined as string | undefined,
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
        meetLink: undefined as string | undefined,
      };
    });

    return [...rlpEvents, ...practiceEvents, ...approvedEvents];
  }, [approvedTests, month, rlpVersion, selectedDay, student.id, year, meetLinksVersion]);

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
    refreshMockTests: syncRequests,
    appendRequest: (row: MockTestRequest) =>
      setRequests((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev])),
    months: SCHEDULE_MONTH_LABELS,
    getSessionsDayStyle: (daySessions: Parameters<typeof getSessionsDayStyle>[0]) =>
      getSessionsDayStyle(daySessions, clientToday),
    isSessionFuture: (session: Parameters<typeof isSessionFuture>[0]) =>
      isSessionFuture(session, clientToday),
    resetView: () => setViewState(DEFAULT_SCHEDULE_VIEW),
  };
}

export type StudentSchedule = ReturnType<typeof useStudentSchedule>;
