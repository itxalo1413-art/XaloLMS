"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/app/StudentLayout";
import {
  ExamLinkCell,
  SelfStudyResultsTable,
  StatusBadge,
} from "@/components/student/SelfStudyResultsTable";
import { StudentSchedulePanel } from "@/components/student/StudentSchedulePanel";
import {
  PracticeClassPanel,
  PracticeClassWeeklyWarning,
} from "@/components/student/PracticeClassPanel";
import { PracticeMeetingAccessBlock } from "@/components/student/PracticeMeetingAccessBlock";
import { StudentDialog } from "@/components/student/StudentDialog";
import { NativeSelectChevron, Panel } from "@/components/student/ui";
import { useStudentSchedule } from "@/hooks/useStudentSchedule";
import { formatBandScore } from "@/lib/formatBandScore";
import { getDaysInMonth } from "@/lib/courseSchedule";
import type { MockTestRequest } from "@/lib/mockTestRequests";
import {
  createMockTestRequest,
  hasDuplicateSlot,
  removeMockTestRequest,
} from "@/lib/mockTestRequests";
import {
  formatIsoDateTimeVi,
  formatMockTestDateTime,
  getDemoSpeakingMockTests,
  isSpeakingMockTest,
  mockTestStatusLabel,
  mockTestStatusTone,
  sortMockTestsByDateDesc,
  speakingResultExamLink,
  speakingResultScore,
  writingStatusLabel,
  writingStatusTone,
} from "@/lib/selfStudyFormat";
import { getStudentIdentity } from "@/lib/studentIdentity";
import {
  getPracticeSlotById,
  getPracticeSlotsForStudent,
  PRACTICE_CLASS_SKILL,
  PRACTICE_CLASS_DESCRIPTION,
  PRACTICE_CLASS_WEEKLY_REREGISTER_WARNING,
  PRACTICE_CLASS_UPDATE_EVENT,
  isPracticeClassJoined,
  refreshPracticeRegistrations,
  registerPracticeSlot,
  resetPracticeClassTestState,
  setPracticeClassJoined,
  unregisterPracticeSlot,
  type PracticeSlotId,
} from "@/lib/practiceClass";
import {
  submitWritingSubmission,
  refreshWritingSubmissionsForStudent,
  WRITING_SUBMISSIONS_EVENT,
  type WritingSubmission,
} from "@/lib/writingSubmissions";
import { fetchAcaFreeSlots, updateAcaFreeSlot, type AcaFreeSlot } from "@/lib/acaManagementApi";

type PageDialog =
  | { kind: "confirm-practice"; slotId: PracticeSlotId }
  | { kind: "success-practice"; slotId: PracticeSlotId }
  | { kind: "duplicate-mock" }
  | { kind: "alert"; message: string };

type DateObj = { day: number; month: number; year: number };

function getDaysInMonthGrid(month: number, year: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  const padding = firstDay === 0 ? 6 : firstDay - 1;
  const days = getDaysInMonth(month, year);
  const grid: (number | null)[] = [];
  for (let i = 0; i < padding; i++) {
    grid.push(null);
  }
  for (let i = 1; i <= days; i++) {
    grid.push(i);
  }
  return grid;
}

export default function HoTroTuHocPage() {
  const router = useRouter();
  const schedule = useStudentSchedule();
  const { month, year, months, myRequests, approvedTests, pendingTests, daysInMonth } = schedule;
  const [regSkill] = useState("Speaking Mock Test");
  
  // Start from actual current real-world month
  const [regMonth, setRegMonth] = useState(new Date().getMonth());
  const [fromDate, setFromDate] = useState<DateObj | null>(null);
  const [toDate, setToDate] = useState<DateObj | null>(null);
  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);

  const [writingLink, setWritingLink] = useState("");
  const [writingSubmissions, setWritingSubmissions] = useState<WritingSubmission[]>([]);
  const [practiceSlotVersion, setPracticeSlotVersion] = useState(0);
  const [practiceJoined, setPracticeJoined] = useState(false);
  const [dialog, setDialog] = useState<PageDialog | null>(null);

  const student = getStudentIdentity();

  // Permanent ACA assigned from the most recent approved request
  const assignedAca = useMemo(() => {
    const sortedApproved = [...myRequests]
      .filter((r) => r.status === "approved" && isSpeakingMockTest(r.skill))
      .sort((a, b) => new Date(b.requestedAt || "").getTime() - new Date(a.requestedAt || "").getTime());
    const match = sortedApproved.find((r) => r.examTeacher && r.examTeacher !== "ACA" && r.examTeacher !== "");
    return match ? match.examTeacher : null;
  }, [myRequests]);

  const calendarGrid = useMemo(() => {
    return getDaysInMonthGrid(regMonth, year);
  }, [regMonth, year]);

  const nextMonthIdx = regMonth === 11 ? 0 : regMonth + 1;
  const nextMonthYear = regMonth === 11 ? year + 1 : year;

  const nextCalendarGrid = useMemo(() => {
    return getDaysInMonthGrid(nextMonthIdx, nextMonthYear);
  }, [nextMonthIdx, nextMonthYear]);

  const activeSlots = useMemo(() => {
    return freeSlots.filter(
      (s) =>
        s.status === "available" &&
        (!assignedAca || s.teacherName === assignedAca) &&
        (
          (s.month === regMonth && s.year === year) ||
          (s.month === nextMonthIdx && s.year === nextMonthYear)
        )
    );
  }, [freeSlots, regMonth, year, nextMonthIdx, nextMonthYear, assignedAca]);

  const availableDaysLeft = useMemo(() => {
    const daysSet = new Set<number>();
    for (const s of activeSlots) {
      if (s.month === regMonth && s.year === year) daysSet.add(s.day);
    }
    return Array.from(daysSet).sort((a, b) => a - b);
  }, [activeSlots, regMonth, year]);

  const availableDaysRight = useMemo(() => {
    const daysSet = new Set<number>();
    for (const s of activeSlots) {
      if (s.month === nextMonthIdx && s.year === nextMonthYear) daysSet.add(s.day);
    }
    return Array.from(daysSet).sort((a, b) => a - b);
  }, [activeSlots, nextMonthIdx, nextMonthYear]);

  const handleDayClick = (d: number, mIdx: number, mYear: number) => {
    const clicked: DateObj = { day: d, month: mIdx, year: mYear };
    const clickedMs = new Date(mYear, mIdx, d).getTime();
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(clicked);
      setToDate(null);
    } else {
      const fromMs = new Date(fromDate.year, fromDate.month, fromDate.day).getTime();
      if (clickedMs >= fromMs) {
        setToDate(clicked);
      } else {
        setFromDate(clicked);
        setToDate(null);
      }
    }
  };

  const slotsInRange = useMemo(() => {
    if (!fromDate) return [] as { date: DateObj; groups: { time: string; mode: "Online" | "Offline"; slots: AcaFreeSlot[] }[] }[];
    const endDate = toDate ?? fromDate;
    const from = new Date(fromDate.year, fromDate.month, fromDate.day);
    const to = new Date(endDate.year, endDate.month, endDate.day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayMap: Record<string, {
      date: DateObj;
      timeSlots: Record<string, { time: string; mode: "Online" | "Offline"; slots: AcaFreeSlot[] }>;
    }> = {};

    for (const s of freeSlots) {
      if (s.status !== "available") continue;
      if (assignedAca && s.teacherName !== assignedAca) continue;
      const slotDate = new Date(s.year, s.month, s.day);
      if (slotDate < from || slotDate > to || slotDate < today) continue;
      const dateKey = `${s.year}-${s.month}-${s.day}`;
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: { day: s.day, month: s.month, year: s.year },
          timeSlots: {},
        };
      }
      const mode = s.type === "Nhận ca Test speaking/ chấm writing offline" ? "Offline" : "Online";
      const timeKey = `${s.time}_${mode}`;
      if (!dayMap[dateKey].timeSlots[timeKey]) {
        dayMap[dateKey].timeSlots[timeKey] = { time: s.time, mode, slots: [] };
      }
      dayMap[dateKey].timeSlots[timeKey].slots.push(s);
    }

    return Object.values(dayMap)
      .sort((a, b) =>
        new Date(a.date.year, a.date.month, a.date.day).getTime() -
        new Date(b.date.year, b.date.month, b.date.day).getTime()
      )
      .map((d) => ({
        date: d.date,
        groups: Object.values(d.timeSlots).sort((a, b) => a.time.localeCompare(b.time)),
      }));
  }, [freeSlots, fromDate, toDate, assignedAca]);

  const loadFreeSlots = useCallback(async () => {
    try {
      const slots = await fetchAcaFreeSlots();
      setFreeSlots(slots);
    } catch (err) {
      console.error("Failed to load free slots", err);
    }
  }, []);

  useEffect(() => {
    void loadFreeSlots();
    window.addEventListener("storage", loadFreeSlots);
    return () => {
      window.removeEventListener("storage", loadFreeSlots);
    };
  }, [loadFreeSlots]);

  const bumpPracticeSlots = useCallback(() => {
    void refreshPracticeRegistrations(student.id).finally(() =>
      setPracticeSlotVersion((v) => v + 1),
    );
  }, [student.id]);

  const registeredPracticeSlotIds = useMemo(
    () => new Set(getPracticeSlotsForStudent(student.id).map((r) => r.slotId)),
    [student.id, practiceSlotVersion],
  );

  const syncPracticeJoined = useCallback(() => {
    const joined =
      getPracticeSlotsForStudent(student.id).length > 0 ||
      isPracticeClassJoined(student.id);
    setPracticeJoined(joined);
  }, [student.id]);

  useEffect(() => {
    syncPracticeJoined();
  }, [syncPracticeJoined, practiceSlotVersion]);

  const refreshWritingSubmissions = useCallback(() => {
    void refreshWritingSubmissionsForStudent(student.id).then(setWritingSubmissions);
  }, [student.id]);



  useEffect(() => {
    refreshWritingSubmissions();
    bumpPracticeSlots();
    window.addEventListener(WRITING_SUBMISSIONS_EVENT, refreshWritingSubmissions);
    window.addEventListener(PRACTICE_CLASS_UPDATE_EVENT, bumpPracticeSlots);
    return () => {
      window.removeEventListener(WRITING_SUBMISSIONS_EVENT, refreshWritingSubmissions);
      window.removeEventListener(PRACTICE_CLASS_UPDATE_EVENT, bumpPracticeSlots);
    };
  }, [refreshWritingSubmissions, bumpPracticeSlots]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("resetPractice") !== "1") return;
    resetPracticeClassTestState(student.id);
    setPracticeJoined(false);
    bumpPracticeSlots();
    router.replace("/ho-tro-tu-hoc");
  }, [student.id, bumpPracticeSlots, router]);

  const handleResetPracticeTest = () => {
    resetPracticeClassTestState(student.id);
    setPracticeJoined(false);
    bumpPracticeSlots();
    setDialog(null);
  };

  const joinPracticeClass = () => {
    setPracticeClassJoined(student.id, true);
    setPracticeJoined(true);
    bumpPracticeSlots();
  };

  const handleRegisterPracticeSlot = (slotId: PracticeSlotId) => {
    if (!getPracticeSlotById(slotId)) return;
    setDialog({ kind: "confirm-practice", slotId });
  };

  const confirmPracticeRegistration = async () => {
    if (dialog?.kind !== "confirm-practice") return;
    const slot = getPracticeSlotById(dialog.slotId);
    if (!slot) {
      setDialog(null);
      return;
    }
    try {
      await registerPracticeSlot(student.id, dialog.slotId);
      const now = new Date();
      await createMockTestRequest({
        studentId: student.id,
        studentName: student.name,
        skill: `${PRACTICE_CLASS_SKILL} · ${slot.title}`,
        day: now.getDate(),
        month: now.getMonth(),
        year: now.getFullYear(),
        examTime: `${slot.dayLabel} ${slot.time}`,
      });
      bumpPracticeSlots();
      setDialog({ kind: "success-practice", slotId: dialog.slotId });
    } catch (err) {
      setDialog({
        kind: "alert",
        message:
          err instanceof Error ? err.message : "Không đăng ký được. Thử lại sau.",
      });
    }
  };

  const handleUnregisterPracticeSlot = async (slotId: PracticeSlotId) => {
    try {
      await unregisterPracticeSlot(student.id, slotId);
      bumpPracticeSlots();
    } catch (err) {
      setDialog({
        kind: "alert",
        message:
          err instanceof Error ? err.message : "Không huỷ đăng ký được. Thử lại sau.",
      });
    }
  };

  const pendingPracticeSlot =
    dialog?.kind === "confirm-practice" ? getPracticeSlotById(dialog.slotId) : null;

  const successPracticeSlot =
    dialog?.kind === "success-practice" ? getPracticeSlotById(dialog.slotId) : null;

  const speakingMockRows = useMemo(() => {
    const rows = sortMockTestsByDateDesc(
      myRequests.filter((r) => isSpeakingMockTest(r.skill)),
    );
    return rows.length > 0 ? rows : getDemoSpeakingMockTests(student.id, student.name);
  }, [myRequests, student.id, student.name]);

  const practiceHistoryRows = useMemo(
    () => [
      { test: "LĐ16", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
      { test: "LĐ17", name: "Dương Ngọc Khôi Nguyên", l: "6.0", r: "5.5", w: "4.5", s: "—" },
      { test: "LĐ18", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
      { test: "LĐ19", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
      { test: "LĐ20", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
    ],
    [],
  );

  const practiceHistoryWithScoreRows = useMemo(
    () =>
      practiceHistoryRows.filter(
        (row) => row.l !== "—" || row.r !== "—" || row.w !== "—" || row.s !== "—",
      ),
    [practiceHistoryRows],
  );

  const registerMockTest = async (date: DateObj, timeOnly: string, mode: "Online" | "Offline") => {
    const { day, month: selMonth, year: selYear } = date;

    if (hasDuplicateSlot(student.id, regSkill, day, selMonth, selYear)) {
      setDialog({ kind: "duplicate-mock" });
      return;
    }

    const availableSlot = freeSlots.find(
      (s) =>
        s.day === day &&
        s.month === selMonth &&
        s.year === selYear &&
        s.time === timeOnly &&
        s.status === "available" &&
        (!assignedAca || s.teacherName === assignedAca) &&
        (mode === "Offline"
          ? s.type === "Nhận ca Test speaking/ chấm writing offline"
          : s.type !== "Nhận ca Test speaking/ chấm writing offline")
    );

    try {
      await createMockTestRequest({
        studentId: student.id,
        studentName: student.name,
        skill: regSkill,
        day,
        month: selMonth,
        year: selYear,
        examTime: `${timeOnly} (${mode})`,
        status: "pending",
        examTeacher: assignedAca || availableSlot?.teacherName || "ACA",
      });

      if (availableSlot) {
        await updateAcaFreeSlot(availableSlot.id, { status: "booked" });
        await loadFreeSlots();
      }
    } catch (err) {
      setDialog({
        kind: "alert",
        message: err instanceof Error ? err.message : "Không đăng ký được mock test.",
      });
    }
  };

  const cancelPendingRequest = async (id: string) => {
    const req = myRequests.find((r) => r.id === id);
    try {
      await removeMockTestRequest(id, student.id);
      if (req) {
        const timePart = (req.examTime || "").split(" (")[0];
        const slots = await fetchAcaFreeSlots();
        const bookedSlot = slots.find(
          (s) =>
            s.day === req.day &&
            s.month === req.month &&
            s.year === req.year &&
            s.time === timePart &&
            s.status === "booked"
        );
        if (bookedSlot) {
          await updateAcaFreeSlot(bookedSlot.id, { status: "available" });
          await loadFreeSlots();
        }
      }
    } catch (err) {
      setDialog({
        kind: "alert",
        message:
          err instanceof Error ? err.message : "Không huỷ được yêu cầu.",
      });
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Hỗ trợ tự học</h2>
          <p className="text-muted text-sm mt-1 font-medium">
            Đăng ký mock test, chấm chữa writing và theo dõi lớp luyện đề tập trung.
          </p>
        </header>

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          
          {/* Left Column: Interactions & Content */}
          <div className="lg:col-span-8 flex min-h-0 flex-col gap-10">
            <Panel title="Đăng ký Mock Test Speaking" className="shrink-0">
              <div className="space-y-0">
                {/* ── BC ORS Date-Range Calendar ── */}
                <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">

                  {/* From / To header bar */}
                  <div className="bg-primary-soft/15 border-b border-zinc-100 px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-600 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Từ:</span>
                        <span className={fromDate ? "text-primary font-black" : "text-zinc-300"}>
                          {fromDate ? `${fromDate.day}/${fromDate.month + 1}/${fromDate.year}` : "—"}
                        </span>
                      </div>
                      <svg className="h-3 w-3 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Đến:</span>
                        <span className={toDate ? "text-primary font-black" : fromDate ? "text-zinc-400 italic text-[10px]" : "text-zinc-300"}>
                          {toDate
                            ? `${toDate.day}/${toDate.month + 1}/${toDate.year}`
                            : fromDate
                            ? "click ngày kết thúc..."
                            : "—"}
                        </span>
                      </div>
                      {(fromDate || toDate) && (
                        <button
                          type="button"
                          onClick={() => { setFromDate(null); setToDate(null); }}
                          className="text-[10px] font-black text-primary underline underline-offset-2 ml-2 shrink-0"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          if (regMonth > now.getMonth() || year > now.getFullYear()) {
                            setRegMonth(regMonth === 0 ? 11 : regMonth - 1);
                          }
                        }}
                        disabled={regMonth <= new Date().getMonth() && year <= new Date().getFullYear()}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (regMonth < 11) setRegMonth(regMonth + 1); }}
                        disabled={regMonth >= 11}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Two-month grid */}
                  <div className="bg-white p-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {(
                      [
                        { monthIdx: regMonth, monthYear: year, grid: calendarGrid, availDays: availableDaysLeft },
                        { monthIdx: nextMonthIdx, monthYear: nextMonthYear, grid: nextCalendarGrid, availDays: availableDaysRight },
                      ] as const
                    ).map(({ monthIdx, monthYear, grid, availDays }, calIdx) => {
                      const fromMs = fromDate ? new Date(fromDate.year, fromDate.month, fromDate.day).getTime() : null;
                      const toMs   = toDate   ? new Date(toDate.year,   toDate.month,   toDate.day).getTime()   : null;
                      return (
                        <div key={calIdx} className={calIdx === 1 ? "sm:border-l sm:border-zinc-100 sm:pl-6" : ""}>
                          <h3 className="text-sm font-black text-foreground mb-4">
                            Tháng {monthIdx + 1}, {monthYear}
                          </h3>
                          <div className="grid grid-cols-7 text-center mb-1">
                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                              <div key={d} className="text-[9px] font-black uppercase tracking-wider text-zinc-400 py-1">{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-y-0.5">
                            {grid.map((d, i) => {
                              if (d === null) return <div key={`e-${calIdx}-${i}`} />;
                              const hasSlots = availDays.includes(d);
                              const todayDate = new Date();
                              const isPast = new Date(monthYear, monthIdx, d) < new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
                              const dayMs = new Date(monthYear, monthIdx, d).getTime();
                              const isFrom = fromDate?.day === d && fromDate?.month === monthIdx && fromDate?.year === monthYear;
                              const isTo   = toDate?.day   === d && toDate?.month   === monthIdx && toDate?.year   === monthYear;
                              const isInRange = fromMs !== null && toMs !== null && dayMs > fromMs && dayMs < toMs;
                              return (
                                <div
                                  key={`d-${calIdx}-${d}`}
                                  className={`flex items-center justify-center py-0.5 ${
                                    isInRange ? "bg-primary/8 rounded-none" : ""
                                  } ${isFrom ? "rounded-l-full" : ""} ${isTo ? "rounded-r-full" : ""}`}
                                >
                                  <button
                                    type="button"
                                    disabled={isPast}
                                    onClick={() => handleDayClick(d, monthIdx, monthYear)}
                                    className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-150 ${
                                      isFrom || isTo
                                        ? "bg-primary text-white font-black shadow-md scale-105"
                                        : isInRange
                                        ? "bg-primary/15 text-primary font-bold"
                                        : hasSlots && !isPast
                                        ? "text-primary underline decoration-2 underline-offset-2 hover:bg-primary/10 font-bold"
                                        : isPast
                                        ? "text-zinc-200 cursor-not-allowed"
                                        : "text-zinc-400 hover:bg-zinc-50"
                                    }`}
                                  >
                                    {d}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hint prompts */}
                {!fromDate && (
                  <div className="mt-4 text-center text-xs font-bold text-zinc-400 py-2">
                    📅 Click chọn ngày bắt đầu, sau đó click ngày kết thúc — Hệ thống sẽ hiển thị các ca test khả dụng trong khoảng đó
                  </div>
                )}
                {fromDate && !toDate && (
                  <div className="mt-4 text-center text-xs font-bold text-zinc-400 py-2">
                    ✅ Ngày bắt đầu: <strong className="text-primary">{fromDate.day}/{fromDate.month + 1}/{fromDate.year}</strong>
                    {" "}— Tiếp tục click ngày kết thúc trên lịch
                  </div>
                )}

                {/* Result cards grouped by date */}
                {fromDate && (
                  <div className="mt-6 space-y-6 animate-in fade-in duration-300">
                    {slotsInRange.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-8 text-center">
                        <div className="text-zinc-400 font-bold text-sm">
                          {toDate
                            ? "Không có ca test nào trong khoảng ngày này"
                            : "Không có ca test nào vào ngày này"}
                        </div>
                        <div className="text-zinc-400 text-xs mt-1">
                          Thử chọn khoảng ngày khác hoặc liên hệ trung tâm để biết lịch rảnh
                        </div>
                      </div>
                    ) : (
                      slotsInRange.map((daySlot) => (
                        <div key={`${daySlot.date.year}-${daySlot.date.month}-${daySlot.date.day}`}>
                          {/* Date separator header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-px flex-1 bg-zinc-100" />
                            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-600 shadow-sm">
                              <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {["CN","T2","T3","T4","T5","T6","T7"][new Date(daySlot.date.year, daySlot.date.month, daySlot.date.day).getDay()]}
                              &nbsp;—&nbsp;
                              {daySlot.date.day} Tháng {daySlot.date.month + 1}, {daySlot.date.year}
                            </div>
                            <div className="h-px flex-1 bg-zinc-100" />
                          </div>

                          <div className="space-y-4">
                            {daySlot.groups.map((g) => {
                              const count = g.slots.length;
                              return (
                                <div key={`${g.time}_${g.mode}`} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                                  <div className="flex items-start gap-2.5 mb-4">
                                    <svg className="h-4 w-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                      <div className="text-sm font-black text-foreground">Xa Lộ English — Cơ sở Thủ Đức</div>
                                      <div className="text-[11px] text-zinc-400 font-medium mt-0.5">50 Lê Văn Việt, Hiệp Phú, Thủ Đức, TP. HCM</div>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/30 p-4 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                      <svg className="h-4 w-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                                      </svg>
                                      <span className="text-sm font-black text-foreground">Speaking</span>
                                      <span className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                                        g.mode === "Offline" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-700"
                                      }`}>{g.mode}</span>
                                    </div>
                                    <div className="rounded-lg bg-primary-soft/20 border border-primary/10 p-3 space-y-2">
                                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                                        <svg className="h-3.5 w-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{daySlot.date.day} Tháng {daySlot.date.month + 1}, {daySlot.date.year}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                                        <svg className="h-3.5 w-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{g.time}</span>
                                      </div>
                                    </div>
                                    {assignedAca && (
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        GV phụ trách cố định: {assignedAca}
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                                    <div>
                                      <span className="text-xs font-bold text-zinc-500">Lệ phí</span>
                                      <span className="ml-2 text-sm font-black text-foreground">Miễn phí</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-400">Còn {count} chỗ</div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => void registerMockTest(daySlot.date, g.time, g.mode)}
                                    className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-black uppercase tracking-wide text-white transition-all hover:bg-primary/90 shadow-sm active:scale-[0.98]"
                                  >
                                    Book Test — Đăng ký
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {pendingTests
                  .filter((t) => isSpeakingMockTest(t.skill))
                  .map((test) => (
                  <div key={test.id} className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex justify-between items-start">
                    <div>
                      <div className="text-sm font-extrabold text-foreground">{test.skill}</div>
                      <div className="text-[10px] font-bold text-muted uppercase mt-1">
                        {formatMockTestDateTime(test)}
                      </div>
                      <div className="mt-1 text-[10px] font-bold text-warning uppercase">Chờ duyệt</div>
                    </div>
                    <button type="button" onClick={() => void cancelPendingRequest(test.id)} className="text-[10px] font-black uppercase text-secondary hover:underline">
                      Hủy
                    </button>
                  </div>
                ))}
              </div>

              <SelfStudyResultsTable<MockTestRequest>
                title="Bảng kết quả Mock Test Speaking"
                emptyMessage="Chưa có lần test nào. Đăng ký buổi test phía trên."
                equalColumns
                getRowKey={(row) => row.id}
                rows={speakingMockRows}
                columns={[
                  {
                    key: "datetime",
                    label: "Ngày giờ test",
                    align: "center",
                    render: (row) => (
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatMockTestDateTime(row)}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Trạng thái",
                    align: "center",
                    render: (row) => (
                      <StatusBadge
                        label={mockTestStatusLabel(row.status)}
                        tone={mockTestStatusTone(row.status)}
                      />
                    ),
                  },
                  {
                    key: "score",
                    label: "Điểm",
                    align: "center",
                    render: (row) => (
                      <span className="text-sm font-black tabular-nums text-primary">
                        {speakingResultScore(row) === "—"
                          ? "—"
                          : formatBandScore(speakingResultScore(row))}
                      </span>
                    ),
                  },
                  {
                    key: "link",
                    label: "Link đề",
                    align: "center",
                    render: (row) => <ExamLinkCell href={speakingResultExamLink(row)} />,
                  },
                ]}
              />
            </Panel>

            <Panel title="Chấm - Chữa Writing" className="flex w-full flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Link bài làm (Google Docs)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={writingLink}
                        onChange={(e) => setWritingLink(e.target.value)}
                        placeholder="Dán link Google Docs vào đây..."
                        className="flex-1 h-11 rounded-xl border border-zinc-200 bg-background px-4 text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!writingLink.trim()) return;
                          void submitWritingSubmission({
                            studentId: student.id,
                            studentName: student.name,
                            examLink: writingLink.trim(),
                          })
                            .then(() => {
                              setWritingLink("");
                              refreshWritingSubmissions();
                            })
                            .catch((err) => {
                              setDialog({
                                kind: "alert",
                                message:
                                  err instanceof Error
                                    ? err.message
                                    : "Không gửi được bài Writing.",
                              });
                            });
                        }}
                        className="h-11 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-secondary/90"
                      >
                        Gửi bài
                      </button>
                    </div>
                  </div>

                  <SelfStudyResultsTable<WritingSubmission>
                    title="Bảng kết quả chấm Writing"
                    emptyMessage="Chưa có bài nộp. Gửi link bài làm phía trên."
                    getRowKey={(row) => row.id}
                    rows={writingSubmissions}
                    columns={[
                      {
                        key: "datetime",
                        label: "Ngày giờ nộp",
                        align: "center",
                        width: "w-[128px]",
                        render: (row) => (
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatIsoDateTimeVi(row.testDateTime)}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        label: "Trạng thái",
                        align: "center",
                        width: "w-[96px]",
                        render: (row) => (
                          <StatusBadge
                            label={writingStatusLabel(row.status)}
                            tone={writingStatusTone(row.status)}
                          />
                        ),
                      },
                      {
                        key: "score",
                        label: "Điểm",
                        align: "center",
                        width: "w-[64px]",
                        render: (row) => (
                          <span className="text-sm font-black tabular-nums text-secondary">
                            {row.score ? formatBandScore(row.score) : "—"}
                          </span>
                        ),
                      },
                      {
                        key: "link",
                        label: "Link bài chấm",
                        align: "center",
                        width: "w-[110px]",
                        render: (row) => (
                          <a
                            href={row.examLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block max-w-full truncate font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Bài làm
                          </a>
                        ),
                      },
                      {
                        key: "graded",
                        label: "Ngày chấm",
                        align: "center",
                        width: "w-[128px]",
                        render: (row) => (
                          <span className="font-semibold tabular-nums text-muted">
                            {row.gradedAt ? formatIsoDateTimeVi(row.gradedAt) : "—"}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
            </Panel>
          </div>

          {/* Right Column: Schedule */}
          <div className="lg:col-span-4 flex min-h-0 flex-col">
            <StudentSchedulePanel schedule={schedule} title="Thời khoá biểu" className="h-full min-h-0" />
          </div>
        </div>

        <div className="mt-10 flex w-full flex-col gap-10">
          {!practiceJoined ? (
            <Panel title="Đăng ký lớp luyện đề" className="w-full">
              <div className="mb-4">
                <PracticeClassWeeklyWarning />
              </div>
              <div className="flex flex-col gap-4 rounded-3xl bg-background p-6 shadow-inner sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-muted">
                  {PRACTICE_CLASS_DESCRIPTION}
                </p>
                <button
                  type="button"
                  onClick={joinPracticeClass}
                  className="h-11 w-full min-w-[140px] shrink-0 rounded-xl bg-primary px-8 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-primary/90 sm:w-[168px] sm:self-center"
                >
                  Đăng ký
                </button>
              </div>
            </Panel>
          ) : (
            <>
              <PracticeClassPanel
                registeredSlotIds={registeredPracticeSlotIds}
                onRegisterSlot={handleRegisterPracticeSlot}
                onUnregisterSlot={handleUnregisterPracticeSlot}
                onResetTest={handleResetPracticeTest}
              />
              {registeredPracticeSlotIds.size > 0 ? (
                <Panel title="Lớp luyện đề — Mock Test Scores" className="w-full">
                  <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-card">
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-background/50">
                          {["TEST", "HỌC VIÊN", "LISTENING", "READING", "WRITING", "SPEAKING"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-primary/5">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {practiceHistoryWithScoreRows.length > 0 ? (
                          practiceHistoryWithScoreRows.map((row, idx) => (
                            <tr key={`${row.test}-${idx}`} className="hover:bg-background/30 transition-colors">
                              <td className="px-4 py-4 text-xs font-bold text-foreground">{row.test}</td>
                              <td className="px-4 py-4 text-xs font-bold text-muted">{row.name}</td>
                              <td className="px-4 py-4 text-xs font-black text-foreground">{row.l}</td>
                              <td className="px-4 py-4 text-xs font-black text-foreground">{row.r}</td>
                              <td className="px-4 py-4 text-xs font-black text-foreground">{row.w}</td>
                              <td className="px-4 py-4 text-xs font-black text-foreground">{row.s}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="hover:bg-background/30 transition-colors">
                            <td className="px-4 py-4 text-xs font-bold text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-bold text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                            <td className="px-4 py-4 text-xs font-black text-muted">—</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              ) : null}
            </>
          )}
        </div>
      </div>

      <StudentDialog
        open={dialog?.kind === "confirm-practice" && Boolean(pendingPracticeSlot)}
        variant="confirm"
        tone="info"
        title="Xác nhận đăng ký buổi học"
        cancelLabel="Huỷ"
        confirmLabel="Đăng ký"
        onClose={() => setDialog(null)}
        onConfirm={confirmPracticeRegistration}
      >
        {pendingPracticeSlot ? (
          <div className="rounded-xl border border-primary/10 bg-background/60 p-3 text-sm">
            <div className="font-black text-foreground">
              [{pendingPracticeSlot.dayLabel}]
              {pendingPracticeSlot.dateNote ? ` ${pendingPracticeSlot.dateNote}` : ""}{" "}
              {pendingPracticeSlot.time}
            </div>
            <div className="mt-1 font-bold text-foreground">{pendingPracticeSlot.title}</div>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-muted">
              Buổi này sẽ hiển thị trên <span className="font-bold text-foreground">Thời khoá biểu</span>{" "}
              (mọi {pendingPracticeSlot.dayLabel} trong tháng đang xem).
            </p>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-warning">
              {PRACTICE_CLASS_WEEKLY_REREGISTER_WARNING}
            </p>
            <div className="mt-3">
              <PracticeMeetingAccessBlock slot={pendingPracticeSlot} compact />
            </div>
          </div>
        ) : null}
      </StudentDialog>

      <StudentDialog
        open={dialog?.kind === "success-practice" && Boolean(successPracticeSlot)}
        tone="success"
        title="Đăng ký thành công"
        onClose={() => setDialog(null)}
      >
        {successPracticeSlot ? (
          <div className="space-y-3">
            <p className="text-sm font-medium leading-relaxed text-muted">
              Buổi học đã được thêm vào <span className="font-bold text-foreground">Thời khoá biểu</span>.
              Dùng thông tin bên dưới để vào phòng:
            </p>
            <PracticeMeetingAccessBlock slot={successPracticeSlot} />
          </div>
        ) : null}
      </StudentDialog>

      <StudentDialog
        open={dialog?.kind === "duplicate-mock"}
        tone="warning"
        title="Không thể đăng ký"
        message="Bạn đã có đăng ký cho kỹ năng và ngày này. Vui lòng chọn ngày hoặc kỹ năng khác."
        onClose={() => setDialog(null)}
      />

      <StudentDialog
        open={dialog?.kind === "alert"}
        tone="warning"
        title="Thông báo"
        message={dialog?.kind === "alert" ? dialog.message : ""}
        onClose={() => setDialog(null)}
      />
    </StudentLayout>
  );
}
