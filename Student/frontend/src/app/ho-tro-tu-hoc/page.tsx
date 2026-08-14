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
import { Panel, CollapsiblePanel } from "@/components/student/ui";
import { useStudentSchedule } from "@/hooks/useStudentSchedule";
import { formatBandScore } from "@/lib/formatBandScore";
import { getGraderMeetLink, GRADER_MEET_LINKS_EVENT } from "@/lib/graderMeetLinks";
import type { MockTestRequest } from "@/lib/mockTestRequests";
import {
  createMockTestRequest,
  deduplicateMockTestRequests,
  removeMockTestRequest,
} from "@/lib/mockTestRequests";
import {
  formatIsoDateTimeVi,
  formatExternalUrl,
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
  PRACTICE_CLASS_WEEKLY_REREGISTER_WARNING,
  PRACTICE_CLASS_UPDATE_EVENT,
  isPracticeClassJoined,
  refreshPracticeRegistrations,
  registerPracticeSlot,
  resetPracticeClassTestState,
  setPracticeClassJoined,
  unregisterPracticeSlot,
  getSaturdayRotatedWeekNumber,
  setPracticeZoomInfo,
  type PracticeSlotId,
} from "@/lib/practiceClass";
import {
  submitWritingSubmission,
  refreshWritingSubmissionsForStudent,
  deduplicateWritingSubmissions,
  WRITING_SUBMISSIONS_EVENT,
  type WritingSubmission,
} from "@/lib/writingSubmissions";
import {
  fetchAcaFreeSlots,
  updateAcaFreeSlot,
  fetchAcaPracticeWeeks,
  findCurrentOrLatestPracticeWeekRange,
  type AcaFreeSlot,
} from "@/lib/acaManagementApi";
import { MOCK_TEST_TEACHER_OPTIONS } from "@/lib/mockTestTeacherNames";
import {
  addPracticeRlpSession,
  canEditPracticeClassRlp,
  canViewPracticeClassRlp,
  deletePracticeRlpSession,
  fetchPracticeRlpForStudent,
  fetchPracticeRlpForTeacher,
  updatePracticeRlpSession,
  canUsePracticeRlpApi,
  type PracticeRlpSession,
  type CreatePracticeRlpPayload,
  type UpdatePracticeRlpPayload,
} from "@/lib/practiceRlpApi";
import { getCachedAuthUser } from "@/lib/auth";

// ─── ISO week key helper ─────────────────────────────────────────────────────
function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${d.getFullYear()}-W${weekNum}`;
}

// Teacher list — exclude generic "Grader" entry
const TEACHER_OPTIONS = MOCK_TEST_TEACHER_OPTIONS.filter((t) => t !== "Grader");

// ─── Types ───────────────────────────────────────────────────────────────────
type PageDialog =
  | { kind: "confirm-practice"; slotId: PracticeSlotId }
  | { kind: "success-practice"; slotId: PracticeSlotId }
  | { kind: "alert"; message: string }
  | { kind: "success-mock"; message: string };

type DateObj = { day: number; month: number; year: number };

// ─── Speaking Booking Modal ──────────────────────────────────────────────────
interface SpeakingBookingModalProps {
  open: boolean;
  onClose: () => void;
  freeSlots: AcaFreeSlot[];
  onBook: (slot: AcaFreeSlot) => Promise<void>;
}

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

/** Returns {year, isoWeek} for a date — used to group by week */
function isoWeekOf(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  const wn = 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${wn}`;
}

/** Mon–Sun range of the ISO week that contains `date` */
function weekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function SpeakingBookingModal({ open, onClose, freeSlots, onBook }: SpeakingBookingModalProps) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Calendar nav — show current month + next month
  const [calMonth, setCalMonth] = useState<{ month: number; year: number }>({
    month: today.getMonth(),
    year: today.getFullYear(),
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [confirmSlot, setConfirmSlot] = useState<AcaFreeSlot | null>(null);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedDate(null);
      setSelectedTeacher(null);
      setConfirmSlot(null);
      setBooking(false);
      setCalMonth({ month: today.getMonth(), year: today.getFullYear() });
    }
  }, [open, today]);

  // Dates that have any available slot (for calendar dots)
  const availableDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of freeSlots) {
      if (s.status === "available" && new Date(s.year, s.month, s.day) >= today) {
        keys.add(`${s.year}-${s.month}-${s.day}`);
      }
    }
    return keys;
  }, [freeSlots, today]);

  // Step 2: teachers who have free slots on the selectedDate
  const teachersForWeek = useMemo(() => {
    if (!selectedDate) return [];
    const selDay = selectedDate.getDate();
    const selMonth = selectedDate.getMonth();
    const selYear = selectedDate.getFullYear();
    const seen = new Set<string>();

    for (const s of freeSlots) {
      if (s.status !== "available") continue;
      if (s.day !== selDay || s.month !== selMonth || s.year !== selYear) continue;
      const d = new Date(s.year, s.month, s.day);
      if (d < today) continue;
      const name = (s.teacherName ?? "").trim();
      if (name) seen.add(name);
    }
    if (seen.size === 0) return [];
    return Array.from(seen);
  }, [freeSlots, selectedDate, today]);

  // Step 3: slots for selectedTeacher on the selectedDate
  const teacherWeekSlots = useMemo(() => {
    if (!selectedDate || !selectedTeacher) return [];
    const selDay = selectedDate.getDate();
    const selMonth = selectedDate.getMonth();
    const selYear = selectedDate.getFullYear();
    const target = selectedTeacher.trim().toLowerCase();

    return freeSlots
      .filter((s) => {
        if (s.status !== "available") return false;
        if (s.day !== selDay || s.month !== selMonth || s.year !== selYear) return false;
        const d = new Date(s.year, s.month, s.day);
        if (d < today) return false;
        const tName = (s.teacherName ?? "").trim().toLowerCase();
        return tName === target || tName.includes(target) || target.includes(tName);
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [freeSlots, selectedDate, selectedTeacher, today]);

  // Group step-3 slots by date
  const groupedByDate = useMemo(() => {
    const map: Record<string, { date: DateObj; slots: AcaFreeSlot[] }> = {};
    for (const s of teacherWeekSlots) {
      const key = `${s.year}-${s.month}-${s.day}`;
      if (!map[key]) map[key] = { date: { day: s.day, month: s.month, year: s.year }, slots: [] };
      map[key].slots.push(s);
    }
    return Object.values(map);
  }, [teacherWeekSlots]);

  // ── Calendar helpers ───────────────────────────────────────────────────────
  function buildCalendarDays(month: number, year: number): (Date | null)[] {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function MiniCalendar({ month, year }: { month: number; year: number }) {
    const cells = buildCalendarDays(month, year);
    return (
      <div>
        <div className="text-xs font-black text-center text-zinc-700 mb-2">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {["T2","T3","T4","T5","T6","T7","CN"].map((d) => (
            <div key={d} className="text-[9px] font-bold text-zinc-400 text-center py-1">{d}</div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const hasDot = availableDateKeys.has(key);
            const isPast = date < today;
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();
            return (
              <button
                key={i}
                type="button"
                disabled={isPast}
                onClick={() => {
                  setSelectedDate(date);
                  setStep(2);
                  setSelectedTeacher(null);
                }}
                className={`relative flex flex-col items-center justify-center rounded-lg py-1 text-[11px] font-bold transition-all
                  ${isPast ? "text-zinc-300 cursor-not-allowed" : "hover:bg-primary/10 cursor-pointer"}
                  ${isSelected ? "bg-primary text-white shadow-sm" : isToday ? "ring-1 ring-primary/40 text-primary" : "text-zinc-700"}
                `}
              >
                {date.getDate()}
                {hasDot && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!confirmSlot) return;
    setBooking(true);
    try {
      await onBook(confirmSlot);
      onClose();
    } finally {
      setBooking(false);
      setConfirmSlot(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-zinc-100 px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">
              {step === 1 ? "Bước 1 / 3" : step === 2 ? "Bước 2 / 3" : "Bước 3 / 3"}
            </div>
            <h3 className="text-base font-black text-foreground">
              {step === 1
                ? "Chọn ngày muốn test Speaking"
                : step === 2
                ? `Chọn giáo viên — Tuần ${selectedDate ? `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}` : ""}`
                : `Lịch rảnh thi Speaking — ${selectedTeacher}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[78vh] overflow-y-auto">

          {/* ── STEP 1: Calendar ── */}
          {step === 1 && (
            <div>
              <p className="text-xs text-zinc-500 font-medium mb-4">
                Chọn ngày bạn muốn test.
              </p>

              {/* Calendar nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(calMonth.year, calMonth.month - 1, 1);
                    setCalMonth({ month: prev.getMonth(), year: prev.getFullYear() });
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs font-black text-zinc-600">
                  {MONTH_NAMES[calMonth.month]} {calMonth.year}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calMonth.year, calMonth.month + 1, 1);
                    setCalMonth({ month: next.getMonth(), year: next.getFullYear() });
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Current month */}
              <MiniCalendar month={calMonth.month} year={calMonth.year} />

              {/* Next month */}
              <div className="mt-5 pt-5 border-t border-zinc-100">
                {(() => {
                  const next = new Date(calMonth.year, calMonth.month + 1, 1);
                  return <MiniCalendar month={next.getMonth()} year={next.getFullYear()} />;
                })()}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-3 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> Có ca rảnh
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary inline-block" /> Ngày đã chọn
                </span>
              </div>
            </div>
          )}

          {/* ── STEP 2: Pick Teacher ── */}
          {step === 2 && (
            <div>
              <button
                type="button"
                onClick={() => { setStep(1); setSelectedTeacher(null); }}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-primary transition-colors mb-4"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Chọn lại ngày
              </button>

              {selectedDate && (
                <p className="text-xs text-zinc-500 font-medium mb-4">
                  Giáo viên có ca rảnh trong tuần chứa{" "}
                  <span className="font-black text-primary">
                    {DAY_NAMES[selectedDate.getDay()]} {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                  </span>:
                </p>
              )}

              {teachersForWeek.length === 0 ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-sm font-bold text-zinc-500">Không có ca rảnh nào</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Ngày này chưa có Giáo viên / Grader nào đăng ký ca rảnh. Vui lòng chọn ngày khác.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {teachersForWeek.map((teacher) => {
                    const selDay = selectedDate ? selectedDate.getDate() : 0;
                    const selMonth = selectedDate ? selectedDate.getMonth() : 0;
                    const selYear = selectedDate ? selectedDate.getFullYear() : 0;
                    const target = teacher.trim().toLowerCase();
                    const count = freeSlots.filter(
                      (s) => {
                        if (s.status !== "available") return false;
                        if (s.day !== selDay || s.month !== selMonth || s.year !== selYear) return false;
                        const tName = (s.teacherName ?? "").trim().toLowerCase();
                        return tName === target || tName.includes(target) || target.includes(tName);
                      }
                    ).length;
                    return (
                      <button
                        key={teacher}
                        type="button"
                        onClick={() => { setSelectedTeacher(teacher); setStep(3); }}
                        className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {teacher}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {count} ca rảnh ngày này
                          </span>
                          <svg className="h-4 w-4 text-zinc-300 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Pick time slot in 3 Shift Columns ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Teacher Info Header Banner */}
              <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shadow-2xs">
                    {(selectedTeacher || "GV").charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">{selectedTeacher}</div>
                    <div className="text-[10px] font-bold text-primary mt-0.5 flex items-center gap-1.5">
                      <span>✨ Giáo viên / Grader phụ trách</span>
                      <span>·</span>
                      <span>{teacherWeekSlots.length} ca rảnh ngày này</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(2); setSelectedTeacher(null); }}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-all"
                >
                  ← Đổi giáo viên
                </button>
              </div>

              {groupedByDate.length === 0 ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-sm font-bold text-zinc-500">Không có ca rảnh</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Giáo viên này chưa có lịch rảnh tuần này. Vui lòng chọn giáo viên khác.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedByDate.map(({ date, slots }) => {
                    const dateObj = new Date(date.year, date.month, date.day);
                    const dayName = DAY_NAMES[dateObj.getDay()];

                    const morningSlots = slots.filter((s) => s.time >= "08:00" && s.time <= "12:00");
                    const afternoonSlots = slots.filter((s) => s.time >= "13:30" && s.time <= "17:00");
                    const eveningSlots = slots.filter((s) => s.time >= "17:30" && s.time <= "21:00");

                    const shifts = [
                      {
                        title: "Ca Sáng",
                        timeRange: "8:00 AM - 12:00 PM",
                        items: morningSlots,
                        cardStyle: "border-primary/20 bg-primary/[0.02]",
                        headerStyle: "bg-primary/10 text-foreground border-primary/15",
                        badgeStyle: "bg-primary/10 text-primary border-primary/20",
                      },
                      {
                        title: "Ca Chiều",
                        timeRange: "1:30 PM - 5:00 PM",
                        items: afternoonSlots,
                        cardStyle: "border-primary/20 bg-primary/[0.02]",
                        headerStyle: "bg-primary/10 text-foreground border-primary/15",
                        badgeStyle: "bg-primary/10 text-primary border-primary/20",
                      },
                      {
                        title: "Ca Tối",
                        timeRange: "5:30 PM - 9:00 PM",
                        items: eveningSlots,
                        cardStyle: "border-primary/20 bg-primary/[0.02]",
                        headerStyle: "bg-primary/10 text-foreground border-primary/15",
                        badgeStyle: "bg-primary/10 text-primary border-primary/20",
                      },
                    ];

                    return (
                      <div key={`${date.year}-${date.month}-${date.day}`} className="space-y-3">
                        {/* Day Header Banner */}
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-zinc-200" />
                          <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-black text-primary shadow-2xs">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {dayName} — {date.day}/{date.month + 1}/{date.year}
                          </div>
                          <div className="h-px flex-1 bg-zinc-200" />
                        </div>

                        {/* 3 Shift Columns Side-by-Side */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                          {shifts.map((shiftGroup) => (
                            <div
                              key={shiftGroup.title}
                              className={`rounded-2xl border overflow-hidden flex flex-col h-full shadow-2xs ${shiftGroup.cardStyle}`}
                            >
                              {/* Shift Header */}
                              <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${shiftGroup.headerStyle}`}>
                                <div>
                                  <h4 className="text-xs font-black uppercase tracking-wider">{shiftGroup.title}</h4>
                                  <p className="text-[9px] font-bold opacity-75">{shiftGroup.timeRange}</p>
                                </div>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${shiftGroup.badgeStyle}`}>
                                  {shiftGroup.items.length} ca
                                </span>
                              </div>

                              {/* Shift Slot Buttons */}
                              <div className="p-3 flex-1 flex flex-col justify-center">
                                {shiftGroup.items.length === 0 ? (
                                  <div className="py-4 text-center text-[11px] font-medium text-zinc-400 italic">
                                    Không có ca rảnh
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {shiftGroup.items.map((slot) => {
                                      const isOffline = slot.type === "Nhận ca Test speaking/ chấm writing offline";
                                      return (
                                        <button
                                          key={slot.id}
                                          type="button"
                                          onClick={() => setConfirmSlot(slot)}
                                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 border text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs ${
                                            isOffline
                                              ? "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                                              : "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-mono text-xs">{slot.time}</span>
                                          </div>
                                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                            isOffline ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                          }`}>
                                            {isOffline ? "Offline" : "Online"}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirm sub-modal */}
      {confirmSlot && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <h4 className="text-base font-black text-foreground mb-1">Xác nhận đặt lịch</h4>
            <p className="text-xs text-zinc-500 mb-4">Bạn sẽ đăng ký ca test Speaking sau:</p>
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm font-black text-foreground">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {selectedTeacher}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {confirmSlot.day}/{confirmSlot.month + 1}/{confirmSlot.year}
                {" — "}
                {DAY_NAMES[new Date(confirmSlot.year, confirmSlot.month, confirmSlot.day).getDay()]}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {confirmSlot.time}
                {" "}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide ${
                  confirmSlot.type === "Nhận ca Test speaking/ chấm writing offline"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-purple-100 text-purple-600"
                }`}>
                  {confirmSlot.type === "Nhận ca Test speaking/ chấm writing offline" ? "Offline" : "Online"}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmSlot(null)}
                disabled={booking}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={booking}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-black text-white hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
              >
                {booking ? "Đang đặt..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HoTroTuHocPage() {
  const router = useRouter();
  const schedule = useStudentSchedule();
  const { myRequests, pendingTests, refreshMockTests, appendRequest } = schedule;
  const [regSkill] = useState("Speaking Mock Test");

  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);
  const [writingLink, setWritingLink] = useState("");
  const [writingSubmissions, setWritingSubmissions] = useState<WritingSubmission[]>([]);
  const [practiceSlotVersion, setPracticeSlotVersion] = useState(0);
  const [practiceJoined, setPracticeJoined] = useState(false);
  const [panel1Open, setPanel1Open] = useState(false);
  const [panel2Open, setPanel2Open] = useState(false);
  const [panel3Open, setPanel3Open] = useState(false);
  const [dialog, setDialog] = useState<PageDialog | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [meetLinksVersion, setMeetLinksVersion] = useState(0);
  const [rlpSessions, setRlpSessions] = useState<PracticeRlpSession[]>([]);

  // Check if current logged-in user can edit Practice RLP (Thanh Tâm or Khánh Thi)
  const canEditRlp = canEditPracticeClassRlp(getCachedAuthUser());
  // Only students AND Thanh Tâm/Khánh Thi can view — other teachers cannot see the RLP table at all
  const canViewRlp = canViewPracticeClassRlp(getCachedAuthUser());

  const student = getStudentIdentity();

  useEffect(() => {
    const onMeetUpdate = () => setMeetLinksVersion((v) => v + 1);
    window.addEventListener(GRADER_MEET_LINKS_EVENT, onMeetUpdate);
    window.addEventListener("storage", onMeetUpdate);
    return () => {
      window.removeEventListener(GRADER_MEET_LINKS_EVENT, onMeetUpdate);
      window.removeEventListener("storage", onMeetUpdate);
    };
  }, []);

  // Load Practice RLP sessions (only for students & Thanh Tâm/Khánh Thi)
  useEffect(() => {
    if (!canUsePracticeRlpApi() || !canViewRlp) return;
    const load = async () => {
      try {
        const sessions = canEditRlp
          ? await fetchPracticeRlpForTeacher(student.id)
          : await fetchPracticeRlpForStudent();
        setRlpSessions(sessions);
      } catch (err) {
        console.warn("Failed to load Practice RLP sessions:", err);
      }
    };
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  // ─── Weekly quota ──────────────────────────────────────────────────────────
  const thisWeekKey = useMemo(() => getISOWeekKey(new Date()), []);

  const bookedThisWeek = useMemo(() => {
    return myRequests.filter(
      (r) =>
        isSpeakingMockTest(r.skill) &&
        (r.status === "pending" || r.status === "approved") &&
        getISOWeekKey(new Date(r.year, r.month, r.day)) === thisWeekKey,
    ).length;
  }, [myRequests, thisWeekKey]);

  const MAX_WEEKLY = 2;
  const canBookMore = bookedThisWeek < MAX_WEEKLY;

  const MAX_WRITING_WEEKLY = 6;

  const submittedWritingThisWeek = useMemo(() => {
    return writingSubmissions.filter((s) => {
      if (!s.testDateTime) return false;
      const testDate = new Date(s.testDateTime);
      return getISOWeekKey(testDate) === thisWeekKey;
    }).length;
  }, [writingSubmissions, thisWeekKey]);

  const currentWeekNumber = useMemo(() => {
    return getSaturdayRotatedWeekNumber();
  }, []);

  // ─── Practice slots ────────────────────────────────────────────────────────
  const bumpPracticeSlots = useCallback(async () => {
    await refreshPracticeRegistrations(student.id);
    setPracticeSlotVersion((v) => v + 1);
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
    if (joined) {
      setPanel3Open(true);
    }
  }, [student.id]);

  useEffect(() => {
    syncPracticeJoined();
  }, [syncPracticeJoined, practiceSlotVersion]);

  useEffect(() => {
    async function syncAcaZoomInfo() {
      try {
        const weeks = await fetchAcaPracticeWeeks();
        if (weeks && weeks.length > 0) {
          const currentWeekRange = findCurrentOrLatestPracticeWeekRange(weeks);
          const activeWeek = weeks.find((w) => w.weekRange === currentWeekRange) || weeks[0];
          if (activeWeek?.zoomId && activeWeek?.zoomPassword) {
            setPracticeZoomInfo({
              zoomId: activeWeek.zoomId,
              zoomPassword: activeWeek.zoomPassword,
            });
          }
        }
      } catch (err) {
        // ignore
      }
    }
    syncAcaZoomInfo();
  }, []);

  // ─── Writing submissions ───────────────────────────────────────────────────
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
    setPanel3Open(false);
    bumpPracticeSlots();
    router.replace("/ho-tro-tu-hoc");
  }, [student.id, bumpPracticeSlots, router]);

  const handleResetPracticeTest = async () => {
    await resetPracticeClassTestState(student.id);
    setPracticeJoined(false);
    setPanel3Open(false);
    await bumpPracticeSlots();
    setDialog(null);
  };

  const joinPracticeClass = () => {
    setPracticeClassJoined(student.id, true);
    setPracticeJoined(true);
    setPanel3Open(true);
    bumpPracticeSlots();
  };

  // ─── Practice RLP handlers ──────────────────────────────────────────────────
  const refreshPracticeRlp = async () => {
    try {
      const sessions = canEditRlp
        ? await fetchPracticeRlpForTeacher(student.id)
        : await fetchPracticeRlpForStudent();
      setRlpSessions(sessions);
    } catch (err) {
      console.warn("Failed to refresh Practice RLP:", err);
    }
  };

  const handleRlpAdd = async (payload: CreatePracticeRlpPayload) => {
    await addPracticeRlpSession(student.id, payload);
    await refreshPracticeRlp();
  };

  const handleRlpUpdate = async (no: number, payload: UpdatePracticeRlpPayload) => {
    await updatePracticeRlpSession(student.id, no, payload);
    await refreshPracticeRlp();
  };

  const handleRlpDelete = async (no: number) => {
    await deletePracticeRlpSession(student.id, no);
    await refreshPracticeRlp();
  };

  const handleRlpToggleHomework = async (row: import("@/lib/courseSchedule").RlpSession) => {
    const isWaiting = row.homeworkStatus === "submitted_waiting";
    const next = isWaiting ? "in_progress" : "submitted_waiting";
    setRlpSessions((prev) =>
      prev.map((s) => (s.no === row.no ? { ...s, homeworkStatus: next } : s)),
    );
    try {
      await updatePracticeRlpSession(student.id, row.no, { homeworkStatus: next });
    } catch (err) {
      console.error("Failed to toggle homework:", err);
      await refreshPracticeRlp(); // revert on error
    }
  };

  // ─── Practice slot registration ────────────────────────────────────────────
  const handleRegisterPracticeSlot = async (slotId: PracticeSlotId) => {
    const slot = getPracticeSlotById(slotId);
    if (!slot) return;
    try {
      await registerPracticeSlot(student.id, slotId);
      const now = new Date();
      await createMockTestRequest({
        studentId: student.id,
        studentName: student.name,
        skill: `${PRACTICE_CLASS_SKILL} · ${slot.title}`,
        day: now.getDate(),
        month: now.getMonth(),
        year: now.getFullYear(),
        examTime: `${slot.dayLabel} ${slot.time}`,
      }).catch(() => {});
      await bumpPracticeSlots();
      setDialog(null);
    } catch (err) {
      console.warn("Register practice slot error:", err);
      await bumpPracticeSlots();
      setDialog(null);
    }
  };

  const handleUnregisterPracticeSlot = async (slotId: PracticeSlotId) => {
    try {
      await unregisterPracticeSlot(student.id, slotId);
      await bumpPracticeSlots();
      setDialog(null);
    } catch (err) {
      console.warn("Unregister practice slot error:", err);
      await bumpPracticeSlots();
      setDialog(null);
    }
  };

  const pendingPracticeSlot =
    dialog?.kind === "confirm-practice" ? getPracticeSlotById(dialog.slotId) : null;

  const successPracticeSlot =
    dialog?.kind === "success-practice" ? getPracticeSlotById(dialog.slotId) : null;

  // ─── Speaking mock test data ───────────────────────────────────────────────
  const [speakingStartDate, setSpeakingStartDate] = useState<string>("");
  const [speakingEndDate, setSpeakingEndDate] = useState<string>("");

  const speakingMockRows = useMemo(() => {
    const raw = myRequests.filter((r) => isSpeakingMockTest(r.skill));
    const deduped = deduplicateMockTestRequests(raw);
    const rows = sortMockTestsByDateDesc(deduped);
    return rows.length > 0 ? rows : getDemoSpeakingMockTests(student.id, student.name);
  }, [myRequests, student.id, student.name]);

  const filteredSpeakingMockRows = useMemo(() => {
    return speakingMockRows.filter((r) => {
      const testDate = new Date(r.year, r.month, r.day);
      testDate.setHours(0, 0, 0, 0);

      if (speakingStartDate) {
        const start = new Date(speakingStartDate);
        start.setHours(0, 0, 0, 0);
        if (testDate < start) return false;
      }

      if (speakingEndDate) {
        const end = new Date(speakingEndDate);
        end.setHours(23, 59, 59, 999);
        if (testDate > end) return false;
      }

      return true;
    });
  }, [speakingMockRows, speakingStartDate, speakingEndDate]);

  // ─── Writing Submissions ──────────────────────────────────────────────────
  const filteredWritingSubmissions = useMemo(() => {
    return deduplicateWritingSubmissions(writingSubmissions);
  }, [writingSubmissions]);
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

  // ─── Free slots ────────────────────────────────────────────────────────────
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

  // ─── Book speaking slot ────────────────────────────────────────────────────
  const handleBookSlot = async (slot: AcaFreeSlot) => {
    const mode =
      slot.type === "Nhận ca Test speaking/ chấm writing offline" ? "Offline" : "Online";

    try {
      const row = await createMockTestRequest({
        studentId: student.id,
        studentName: student.name,
        skill: regSkill,
        day: slot.day,
        month: slot.month,
        year: slot.year,
        examTime: `${slot.time} (${mode})`,
        status: "approved",
        examTeacher: slot.teacherName || "ACA",
      });

      // Optimistic: show immediately in table
      appendRequest(row);

      await updateAcaFreeSlot(slot.id, { status: "booked" });
      // Background sync to reconcile with server
      refreshMockTests();
      await loadFreeSlots();

      setBookingModalOpen(false);
      setDialog({
        kind: "success-mock",
        message: "Đăng ký ca test Speaking thành công!",
      });
    } catch (err) {
      setDialog({
        kind: "alert",
        message: err instanceof Error ? err.message : "Không đăng ký được mock test.",
      });
    }
  };

  // ─── Cancel pending request ────────────────────────────────────────────────
  const cancelPendingRequest = async (id: string) => {
    const req = myRequests.find((r) => r.id === id);
    try {
      await removeMockTestRequest(id, student.id);
      refreshMockTests();
      if (req) {
        const timePart = (req.examTime || "").split(" (")[0];
        const slots = await fetchAcaFreeSlots();
        const bookedSlot = slots.find(
          (s) =>
            s.day === req.day &&
            s.month === req.month &&
            s.year === req.year &&
            s.time === timePart &&
            s.status === "booked",
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div className="space-y-10 pb-20 ">
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Hỗ trợ tự học</h2>
          <p className="text-muted text-sm mt-1 font-medium">
            Đăng ký mock test, chấm chữa writing và theo dõi lớp luyện đề tập trung.
          </p>
        </header>

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">

          {/* Left Column */}
          <div className="lg:col-span-9 flex min-h-0 flex-col">
            <CollapsiblePanel
              title="Mock Test Speaking"
              className="shrink-0 z-10"
              transparentTab={true}
              
              isOpen={panel1Open}
              onToggle={setPanel1Open}
              topContent={
                <div className="space-y-4">
                  {/* ── Weekly quota card ── */}
                  <div className="rounded-2xl border border-zinc-100 bg-[#595082] from-primary/5 to-transparent p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      {/* Circular progress */}
                      <div className="relative h-16 w-16 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18" cy="18" r="15.9"
                            fill="none"
                            stroke="#e4e4e7"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18" cy="18" r="15.9"
                            fill="none"
                            stroke={bookedThisWeek >= MAX_WEEKLY ? "#10b981" : "#6a5acd"}
                            strokeWidth="3"
                            strokeDasharray={`${(Math.min(bookedThisWeek, MAX_WEEKLY) / MAX_WEEKLY) * 100} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-[#f8c662] tabular-nums">
                            {Math.min(bookedThisWeek, MAX_WEEKLY)}/{MAX_WEEKLY}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-[#f8c662]">Ca Speaking tuần này</div>
                        {bookedThisWeek === 0 && (
                          <div className="text-xs text-[#f8c662] font-medium mt-0.5">
                            Chưa đăng ký ca nào tuần này
                          </div>
                        )}
                        {bookedThisWeek > 0 && bookedThisWeek < MAX_WEEKLY && (
                          <div className="text-xs text-primary font-bold mt-0.5">
                            Còn {MAX_WEEKLY - bookedThisWeek} ca có thể đăng ký
                          </div>
                        )}
                        {bookedThisWeek >= MAX_WEEKLY && (
                          <div className="text-xs text-emerald-600 font-bold mt-0.5">
                            Đã đủ {MAX_WEEKLY} ca tuần này
                          </div>
                        )}
                        <div className="text-[10px] text-[#f8c662] font-medium mt-0.5">

                          Luyện tập mock test speaking 2 lần/tuần với giáo viên miễn phí
                
                        </div>
                      </div>
                    </div>

                    {/* Register button */}
                    <button
                      type="button"
                      onClick={() => setBookingModalOpen(true)}
                      disabled={!canBookMore}
                      className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black uppercase tracking-wide transition-all shadow-sm ${
                        canBookMore
                          ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] hover:shadow-md"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      {canBookMore ? "Đăng ký ngay" : "Đã đủ ca tuần này"}
                    </button>
                  </div>

                  {/* ── Upcoming tests ── */}
                  {(() => {
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const upcoming = deduplicateMockTestRequests(
                      myRequests.filter((t) => {
                        if (!isSpeakingMockTest(t.skill)) return false;
                        if (t.status !== "pending" && t.status !== "approved") return false;
                        if (t.score) return false;
                        const testDate = new Date(t.year, t.month, t.day, 23, 59, 59);
                        return testDate >= todayStart;
                      })
                    );
                    if (upcoming.length === 0) return null;
                    return (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {upcoming.map((test) => (
                          <div key={test.id} className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex justify-between items-start">
                            <div>
                              <div className="text-sm font-extrabold text-foreground">{test.skill}</div>
                              <div className="text-[10px] font-bold text-muted uppercase mt-1">
                                {formatMockTestDateTime(test)}
                              </div>
                              {test.examTeacher && test.examTeacher !== "ACA" && (
                                <div className="text-[10px] font-bold text-primary mt-0.5">
                                  GV: {test.examTeacher}
                                </div>
                              )}
                              <div className={`mt-1 text-[10px] font-bold uppercase ${test.status === "approved" ? "text-emerald-600" : "text-amber-600"}`}>
                                {test.status === "approved" ? "Đã xác nhận" : "Chờ duyệt"}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void cancelPendingRequest(test.id)}
                              className="text-[10px] font-black uppercase text-secondary hover:underline"
                            >
                              Hủy ca
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              }
            >
              {/* ── Results table ── */}
              <SelfStudyResultsTable<MockTestRequest>
                title="Bảng kết quả Mock Test Speaking"
                headerRight={
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted">Từ ngày:</span>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        id="speaking-start-date"
                        value={speakingStartDate}
                        onChange={(e) => setSpeakingStartDate(e.target.value)}
                        className="h-8 rounded-xl border border-primary/20 bg-background pl-2.5 pr-8 py-1 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("speaking-start-date") as any;
                          if (el) {
                            if (typeof el.showPicker === "function") {
                              el.showPicker();
                            } else if (typeof el.focus === "function") {
                              el.focus();
                            }
                          }
                        }}
                        className="absolute right-2.5 text-zinc-400 hover:text-primary transition-colors text-xs cursor-pointer"
                        title="Bấm để mở lịch chọn ngày"
                      >
                        📅
                      </button>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-wider text-muted">Đến ngày:</span>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        id="speaking-end-date"
                        value={speakingEndDate}
                        onChange={(e) => setSpeakingEndDate(e.target.value)}
                        className="h-8 rounded-xl border border-primary/20 bg-background pl-2.5 pr-8 py-1 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("speaking-end-date") as any;
                          if (el) {
                            if (typeof el.showPicker === "function") {
                              el.showPicker();
                            } else if (typeof el.focus === "function") {
                              el.focus();
                            }
                          }
                        }}
                        className="absolute right-2.5 text-zinc-400 hover:text-primary transition-colors text-xs cursor-pointer"
                        title="Bấm để mở lịch chọn ngày"
                      >
                        📅
                      </button>
                    </div>

                    {(speakingStartDate || speakingEndDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSpeakingStartDate("");
                          setSpeakingEndDate("");
                        }}
                        className="h-8 px-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-black uppercase tracking-wider transition-all"
                        title="Xóa bộ lọc ngày"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>
                }
                emptyMessage="Không tìm thấy kết quả test nào trong khoảng thời gian đã chọn."
                equalColumns
                getRowKey={(row) => row.id}
                rows={filteredSpeakingMockRows}
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
                    key: "teacher",
                    label: "Giáo viên",
                    align: "center",
                    render: (row) => (
                      <span className="text-xs font-bold text-zinc-600">
                        {row.examTeacher || "—"}
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
                  {
                    key: "meetLink",
                    label: "Link Google Meet",
                    align: "center",
                    render: (row) => {
                      const meetUrl = getGraderMeetLink(row.examTeacher);
                      return (
                        <a
                          href={meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-2xs"
                          title={`Link Google Meet cố định của ${row.examTeacher || "Grader"}`}
                        >
                          <svg className="h-3.5 w-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Link test spk ↗
                        </a>
                      );
                    },
                  },
                ]}
              />
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Chấm - Chữa Writing"
              className={`w-full transition-all duration-300 z-20 ${panel1Open ? "mt-8" : "-mt-2"}`}
              transparentTab={true}
              isOpen={panel2Open}
              onToggle={setPanel2Open}
              topContent={
                <div className="space-y-4">
                  {/* ── Weekly Writing quota card ── */}
                  <div className="rounded-2xl border border-zinc-100 bg-gradient-to-br from-secondary/5 to-transparent p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      {/* Circular progress */}
                      <div className="relative h-16 w-16 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18" cy="18" r="15.9"
                            fill="none"
                            stroke="#e4e4e7"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18" cy="18" r="15.9"
                            fill="none"
                            stroke={submittedWritingThisWeek >= MAX_WRITING_WEEKLY ? "#10b981" : "#ec4899"}
                            strokeWidth="3"
                            strokeDasharray={`${(Math.min(submittedWritingThisWeek, MAX_WRITING_WEEKLY) / MAX_WRITING_WEEKLY) * 100} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-foreground tabular-nums">
                            {Math.min(submittedWritingThisWeek, MAX_WRITING_WEEKLY)}/{MAX_WRITING_WEEKLY}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-foreground">Bài Writing tuần này</div>
                        {submittedWritingThisWeek === 0 && (
                          <div className="text-xs text-zinc-500 font-medium mt-0.5">
                            Chưa nộp bài nào tuần này
                          </div>
                        )}
                        {submittedWritingThisWeek > 0 && submittedWritingThisWeek < MAX_WRITING_WEEKLY && (
                          <div className="text-xs text-secondary font-bold mt-0.5">
                            Còn {MAX_WRITING_WEEKLY - submittedWritingThisWeek} bài có thể nộp
                          </div>
                        )}
                        {submittedWritingThisWeek >= MAX_WRITING_WEEKLY && (
                          <div className="text-xs text-emerald-600 font-bold mt-0.5">
                            Đã đủ {MAX_WRITING_WEEKLY} bài tuần này
                          </div>
                        )}
                        <div className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          Tối đa 6 bài 1 tuần
                        </div>
                      </div>
                    </div>

                    {/* Register button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPanel2Open(true);
                        setTimeout(() => {
                          const el = document.getElementById("writing-link-input");
                          if (el) el.focus();
                        }, 100);
                      }}
                      disabled={submittedWritingThisWeek >= MAX_WRITING_WEEKLY}
                      className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black uppercase tracking-wide transition-all shadow-sm ${
                        submittedWritingThisWeek < MAX_WRITING_WEEKLY
                          ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] hover:shadow-md"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      {submittedWritingThisWeek < MAX_WRITING_WEEKLY ? "Đăng ký ngay" : "Đã đủ 6 bài/tuần"}
                    </button>
                  </div>
                </div>
              }
            >
              <div className="space-y-6">
                {/* Submit link input — Appears when clicking Đăng ký ngay */}
                <div className="flex flex-col gap-2 rounded-2xl border border-primary/15 bg-secondary/5 p-4">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest">Link bài làm (Google Docs)</label>
                  <div className="flex gap-2">
                    <input
                      id="writing-link-input"
                      type="text"
                      value={writingLink}
                      onChange={(e) => setWritingLink(e.target.value)}
                      placeholder="Dán link Google Docs vào đây..."
                      className="flex-1 h-11 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-medium focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
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
                      className="h-11 rounded-xl bg-secondary px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-secondary/90 shadow-2xs"
                    >
                      Gửi bài
                    </button>
                  </div>
                </div>
              <SelfStudyResultsTable<WritingSubmission>
                title="Bảng kết quả chấm Writing"
                emptyMessage="Chưa có bài nộp Writing nào."
                getRowKey={(row) => row.id}
                rows={filteredWritingSubmissions}
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
                    render: (row) =>
                      formatExternalUrl(row.examLink) ? (
                        <a
                          href={formatExternalUrl(row.examLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block max-w-full truncate font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        <span className="text-zinc-400 text-xs italic">—</span>
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
            </CollapsiblePanel>

            {/* ── Lớp Luyện Đề Section ── */}
            <CollapsiblePanel
              title="Đăng ký lớp luyện đề"
              className={`w-full transition-all duration-300 z-30 ${panel2Open ? "mt-8" : "-mt-2"}`}
              transparentTab={true}
              isOpen={panel3Open}
              hideToggle={!practiceJoined}
              onToggle={setPanel3Open}
              topContent={
                <div className="space-y-4">
                  {/* ── Weekly Practice Class info card ── */}
                  <div className="rounded-2xl border border-zinc-100 bg-gradient-to-br from-primary/5 to-transparent p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      {/* Week badge */}
                      <div className="relative h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center border border-primary/20 shadow-2xs">
                        <span className="text-[9px] font-black uppercase text-primary tracking-wider">Đề tuần</span>
                        <span className="text-xl font-black text-foreground tabular-nums leading-none mt-0.5">38</span>
                      </div>
                      <div>
                        <div className="text-sm font-black text-foreground">Đề theo tuần (Tuần này là đề số 38)</div>
                        <div className="text-xs text-primary font-bold mt-0.5">
                          Bộ đề thi thử L-R-W & Speaking cập nhật mới mỗi tuần
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          Đăng ký lại lịch luyện đề hàng tuần tại đây
                        </div>
                      </div>
                    </div>

                    {/* Register button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!practiceJoined) {
                          joinPracticeClass();
                        }
                        setPanel3Open(true);
                      }}
                      className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black uppercase tracking-wide text-white transition-all shadow-sm hover:bg-primary/90 active:scale-[0.98] hover:shadow-md cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Đăng ký ngay
                    </button>
                  </div>
                </div>
              }
            >
                {practiceJoined && (
                <PracticeClassPanel
                  registeredSlotIds={registeredPracticeSlotIds}
                  onRegisterSlot={handleRegisterPracticeSlot}
                  onUnregisterSlot={handleUnregisterPracticeSlot}
                  onResetTest={handleResetPracticeTest}
                  scoresRows={practiceHistoryWithScoreRows}
                  studentId={student.id}
                  rlpSessions={rlpSessions}
                  showRlp={canViewRlp}
                  canEditRlp={canEditRlp}
                  onRlpAdd={canEditRlp ? handleRlpAdd : undefined}
                  onRlpUpdate={canEditRlp ? handleRlpUpdate : undefined}
                  onRlpDelete={canEditRlp ? handleRlpDelete : undefined}
                  onToggleHomework={handleRlpToggleHomework}
                />
              )}
            </CollapsiblePanel>
          </div>

          {/* Right Column: Schedule (sticky top when scrolling, natural content height) */}
          <div className="lg:col-span-3 self-start sticky top-4 z-20">
            <StudentSchedulePanel schedule={schedule} title="Thời khoá biểu" className="w-full" />
          </div>
        </div>
      </div>

      {/* ── Speaking Booking Modal ── */}
      <SpeakingBookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        freeSlots={freeSlots}
        onBook={handleBookSlot}
      />

      {/* ── Practice Dialogs ── */}

      <StudentDialog
        open={dialog?.kind === "success-mock"}
        tone="success"
        title="Đăng ký thành công"
        message={dialog?.kind === "success-mock" ? dialog.message : ""}
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
