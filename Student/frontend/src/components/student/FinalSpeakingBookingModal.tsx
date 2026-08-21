"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAcaFreeSlots,
  updateAcaFreeSlot,
  type AcaFreeSlot,
} from "@/lib/acaManagementApi";
import { createFinalTestRecord } from "@/lib/finalTestArchive";

interface FinalSpeakingBookingModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  onSuccess?: () => void;
}

type DateObj = { day: number; month: number; year: number };

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export function FinalSpeakingBookingModal({
  open,
  onClose,
  studentId,
  studentName,
  studentPhone,
  onSuccess,
}: FinalSpeakingBookingModalProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Calendar nav
  const [calMonth, setCalMonth] = useState<{ month: number; year: number }>({
    month: today.getMonth(),
    year: today.getFullYear(),
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [confirmSlot, setConfirmSlot] = useState<AcaFreeSlot | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load free slots
  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const data = await fetchAcaFreeSlots();
      setFreeSlots(data || []);
    } catch {
      setFreeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadSlots();
    } else {
      setStep(1);
      setSelectedDate(null);
      setSelectedTeacher(null);
      setConfirmSlot(null);
      setBooking(false);
      setErrorMsg(null);
      setCalMonth({ month: today.getMonth(), year: today.getFullYear() });
    }
  }, [open, today]);

  // Dates that have available slots
  const availableDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of freeSlots) {
      if (s.status === "available" && new Date(s.year, s.month, s.day) >= today) {
        keys.add(`${s.year}-${s.month}-${s.day}`);
      }
    }
    return keys;
  }, [freeSlots, today]);

  // Step 2: teachers who have free slots on selectedDate
  const teachersForDate = useMemo(() => {
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
    return Array.from(seen);
  }, [freeSlots, selectedDate, today]);

  // Step 3: slots for selectedTeacher on selectedDate
  const teacherDateSlots = useMemo(() => {
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
    for (const s of teacherDateSlots) {
      const key = `${s.year}-${s.month}-${s.day}`;
      if (!map[key]) map[key] = { date: { day: s.day, month: s.month, year: s.year }, slots: [] };
      map[key].slots.push(s);
    }
    return Object.values(map);
  }, [teacherDateSlots]);

  // Calendar builders
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
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div key={d} className="text-[9px] font-bold text-zinc-400 text-center py-1">
              {d}
            </div>
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
                className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                  isPast
                    ? "text-zinc-300 cursor-not-allowed"
                    : "hover:bg-primary/10 cursor-pointer"
                } ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : isToday
                    ? "ring-1 ring-primary/40 text-primary"
                    : "text-zinc-700"
                }`}
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
    setErrorMsg(null);
    try {
      const isOffline = confirmSlot.type === "Nhận ca Test speaking/ chấm writing offline";
      const monthFormatted = String(confirmSlot.month + 1).padStart(2, "0");
      const dayFormatted = String(confirmSlot.day).padStart(2, "0");
      const dateStr = `${confirmSlot.year}-${monthFormatted}-${dayFormatted}`;

      await createFinalTestRecord({
        candidateName: studentName,
        candidatePhone: studentPhone || "0947 188 794",
        studentId: studentId,
        testType: "speaking",
        format: isOffline ? "offline" : "online",
        examinerName: confirmSlot.teacherName || "Giám khảo",
        date: dateStr,
        time: confirmSlot.time,
        targetBand: "6.5",
      });

      await updateAcaFreeSlot(confirmSlot.id, { status: "booked" });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Đăng ký ca thi thất bại. Vui lòng thử lại.");
    } finally {
      setBooking(false);
      setConfirmSlot(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-zinc-100 px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">
              {step === 1 ? "Bước 1 / 3" : step === 2 ? "Bước 2 / 3" : "Bước 3 / 3"}
            </div>
            <h3 className="text-base font-black text-foreground">
              {step === 1
                ? "Chọn ngày muốn thi Final Test Speaking"
                : step === 2
                ? `Chọn Giám khảo — Ngày ${selectedDate ? `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}` : ""}`
                : `Lịch rảnh thi Speaking — ${selectedTeacher}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[78vh] overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* ── STEP 1: Calendar ── */}
          {step === 1 && (
            <div>
              <p className="text-xs text-zinc-500 font-medium mb-4">
                Chọn ngày bạn muốn thi Speaking 1-1 với Giám khảo.
              </p>

              {/* Calendar nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(calMonth.year, calMonth.month - 1, 1);
                    setCalMonth({ month: prev.getMonth(), year: prev.getFullYear() });
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

          {/* ── STEP 2: Pick Examiner / Teacher ── */}
          {step === 2 && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedTeacher(null);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-primary transition-colors mb-4 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Chọn lại ngày
              </button>

              {selectedDate && (
                <p className="text-xs text-zinc-500 font-medium mb-4">
                  Giám khảo / Giáo viên có ca rảnh vào ngày{" "}
                  <span className="font-black text-primary">
                    {DAY_NAMES[selectedDate.getDay()]} {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                  </span>:
                </p>
              )}

              {teachersForDate.length === 0 ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-sm font-bold text-zinc-500">Không có ca rảnh nào</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Ngày này chưa có Giám khảo đăng ký ca rảnh. Vui lòng chọn ngày khác.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {teachersForDate.map((teacher) => {
                    const selDay = selectedDate ? selectedDate.getDate() : 0;
                    const selMonth = selectedDate ? selectedDate.getMonth() : 0;
                    const selYear = selectedDate ? selectedDate.getFullYear() : 0;
                    const target = teacher.trim().toLowerCase();
                    const count = freeSlots.filter((s) => {
                      if (s.status !== "available") return false;
                      if (s.day !== selDay || s.month !== selMonth || s.year !== selYear) return false;
                      const tName = (s.teacherName ?? "").trim().toLowerCase();
                      return tName === target || tName.includes(target) || target.includes(tName);
                    }).length;

                    return (
                      <button
                        key={teacher}
                        type="button"
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setStep(3);
                        }}
                        className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                          <svg className="h-4 w-4 text-zinc-300 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

          {/* ── STEP 3: Pick Time Slot ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Examiner Banner */}
              <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shadow-2xs">
                    {(selectedTeacher || "GV").charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">{selectedTeacher}</div>
                    <div className="text-[10px] font-bold text-primary mt-0.5 flex items-center gap-1.5">
                      <span>✨ Giám khảo chấm thi Speaking</span>
                      <span>·</span>
                      <span>{teacherDateSlots.length} ca rảnh ngày này</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setSelectedTeacher(null);
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-all cursor-pointer"
                >
                  ← Đổi Giám khảo
                </button>
              </div>

              {groupedByDate.length === 0 ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-sm font-bold text-zinc-500">Không có ca rảnh</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Giám khảo này chưa có ca rảnh vào ngày đã chọn. Vui lòng chọn Giám khảo khác.
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
                        {/* Day Header */}
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-zinc-200" />
                          <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-black text-primary shadow-2xs">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {dayName} — {date.day}/{date.month + 1}/{date.year}
                          </div>
                          <div className="h-px flex-1 bg-zinc-200" />
                        </div>

                        {/* 3 Shift Columns */}
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

                              {/* Slot Buttons */}
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
                                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 border text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer ${
                                            isOffline
                                              ? "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                                              : "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
            className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirm Sub-modal */}
      {confirmSlot && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setConfirmSlot(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <h4 className="text-base font-black text-foreground">Xác nhận đăng ký Final Test Speaking</h4>
            <p className="text-xs text-zinc-500">Bạn sẽ đăng ký ca thi Speaking 1-1 sau:</p>
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black text-foreground">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {selectedTeacher}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {confirmSlot.day}/{confirmSlot.month + 1}/{confirmSlot.year}
                {" — "}
                {DAY_NAMES[new Date(confirmSlot.year, confirmSlot.month, confirmSlot.day).getDay()]}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSlot(null)}
                disabled={booking}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={booking}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-black text-white hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
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
