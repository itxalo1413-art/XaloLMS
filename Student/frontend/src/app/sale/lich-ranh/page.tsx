"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAcaFreeSlots,
  type AcaFreeSlot,
} from "@/lib/acaManagementApi";
import { MOCK_TEST_TEACHER_OPTIONS } from "@/lib/mockTestTeacherNames";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";
import { EntranceBookingModal } from "@/components/sale/EntranceBookingModal";
import {
  ENTRANCE_BOOKINGS_UPDATE_EVENT,
  listEntranceTestBookings,
  type EntranceTestBooking,
} from "@/lib/entranceTestBookings";

function getMondayOfCurrentWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function generateWeeks() {
  const weeks = [];
  const startMonday = getMondayOfCurrentWeek(new Date());
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < 5; i++) {
    const monday = new Date(startMonday.getTime());
    monday.setDate(startMonday.getDate() + i * 7);

    const sunday = new Date(monday.getTime());
    sunday.setDate(monday.getDate() + 6);

    const monthLabel = monthNames[monday.getMonth()].toUpperCase();
    const label = `[${monthLabel}/Tuần ${i + 1}]`;

    const formatDateShort = (dt: Date) => {
      const dd = String(dt.getDate()).padStart(2, "0");
      const mmm = monthNames[dt.getMonth()];
      return `${dd}/${mmm}`;
    };

    const ddSunday = String(sunday.getDate()).padStart(2, "0");
    const mmmSunday = monthNames[sunday.getMonth()];

    const labelFull = `Tuần ${i + 1} (${formatDateShort(monday)} - ${ddSunday}/${mmmSunday}/${sunday.getFullYear()})`;
    weeks.push({
      label,
      labelFull,
      startDate: monday,
    });
  }
  return weeks;
}

const WEEKS_DATA = generateWeeks();

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

export default function SaleLichRanhGraderPage() {
  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);
  const [bookings, setBookings] = useState<EntranceTestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeacher, setSelectedTeacher] = useState<string>(MOCK_TEST_TEACHER_OPTIONS[0]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);

  // Modal State
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    grader?: string;
    date?: string;
    time?: string;
    slotId?: string;
    format?: "online" | "offline";
  }>({ isOpen: false });

  const graderMeetLink = useMemo(() => {
    return getGraderMeetLink(selectedTeacher);
  }, [selectedTeacher]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotsData, bookingsData] = await Promise.all([
        fetchAcaFreeSlots(),
        listEntranceTestBookings(),
      ]);
      setFreeSlots(slotsData);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err?.message || "Không tải được lịch rảnh Grader.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const onUpdate = () => void loadData();
    window.addEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(ENTRANCE_BOOKINGS_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [loadData]);

  // Date helper
  const getDayDate = useCallback((weekIdx: number, dayOffset: number) => {
    const start = WEEKS_DATA[weekIdx].startDate;
    const d = new Date(start);
    d.setDate(start.getDate() + dayOffset);
    return d;
  }, []);

  const formatTime12h = (t24: string) => {
    const [hStr, mStr] = t24.split(":");
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mStr} ${ampm}`;
  };

  const getWeekRangeLabel = useMemo(() => {
    return WEEKS_DATA[currentWeekIndex].labelFull;
  }, [currentWeekIndex]);

  // Day of week column headers
  const gridHeaders = useMemo(() => {
    const daysName = ["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7", "CHỦ NHẬT"];
    return Array.from({ length: 7 }).map((_, i) => {
      const d = getDayDate(currentWeekIndex, i);
      const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        dateStr,
        isoDate,
        dayName: daysName[i],
        offset: i,
      };
    });
  }, [currentWeekIndex, getDayDate]);

  // Free slots count & total weekly hours
  const availableSlotsCount = useMemo(() => {
    const monday = getDayDate(currentWeekIndex, 0);
    const sunday = getDayDate(currentWeekIndex, 6);
    return freeSlots.filter((s) => {
      const d = new Date(s.year, s.month, s.day);
      return (
        d >= monday &&
        d <= sunday &&
        (s.teacherName ?? "").trim().toLowerCase() === selectedTeacher.trim().toLowerCase() &&
        s.status !== "booked"
      );
    }).length;
  }, [freeSlots, currentWeekIndex, selectedTeacher, getDayDate]);

  // Booked tests for current week
  const weeklyTests = useMemo(() => {
    const monday = getDayDate(currentWeekIndex, 0);
    monday.setHours(0, 0, 0, 0);
    const sunday = getDayDate(currentWeekIndex, 6);
    sunday.setHours(23, 59, 59, 999);

    return bookings.filter((b) => {
      const d = new Date(b.year, b.month, b.day);
      const inWeek = d >= monday && d <= sunday;
      const matchGrader = (b.graderName ?? "").trim().toLowerCase() === selectedTeacher.trim().toLowerCase();
      return inWeek && matchGrader && b.status !== "cancelled";
    });
  }, [bookings, currentWeekIndex, selectedTeacher, getDayDate]);

  // Handle clicking a slot
  const handleSlotClick = (dayOffset: number, timeSlot: string, slotDoc?: AcaFreeSlot) => {
    const targetDate = getDayDate(currentWeekIndex, dayOffset);
    const isoDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

    const isOffline = slotDoc?.type?.includes("offline");

    setBookingModalState({
      isOpen: true,
      grader: selectedTeacher,
      date: isoDate,
      time: timeSlot,
      slotId: slotDoc?.id,
      format: isOffline ? "offline" : "online",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Lịch Rảnh Grader & Đặt Lịch Chấm</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tra cứu ca rảnh của nhân viên Grader để đặt lịch chấm Speaking và Writing Entrance
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setBookingModalState({
              isOpen: true,
              grader: selectedTeacher,
            })
          }
          className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 transition-all shadow-lg hover:shadow-amber-500/20 shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Đặt Lịch Test Entrance
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400">
          {error}
        </div>
      )}

      {/* Grader Filter & Week Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center rounded-2xl border border-slate-800 bg-slate-950 p-4">
        {/* Left: Grader Selector */}
        <div className="lg:col-span-4 flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Grader:</span>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-amber-300 outline-none focus:border-amber-500/60 cursor-pointer"
          >
            {MOCK_TEST_TEACHER_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Center: Grader Meet Link */}
        <div className="lg:col-span-5 flex items-center gap-2">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider shrink-0">Meet:</span>
          <div className="flex-1 text-xs text-slate-300 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 truncate">
            {graderMeetLink || "Chưa cập nhật link Meet"}
          </div>
          {graderMeetLink && (
            <a
              href={graderMeetLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-black text-white transition-all shrink-0"
            >
              Mở Meet ↗
            </a>
          )}
        </div>

        {/* Right: Week range & Slots count */}
        <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-3 text-right">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số ca còn rảnh</span>
            <span className="text-sm font-black text-amber-400">{availableSlotsCount} ca ({(availableSlotsCount * 0.5)}h)</span>
          </div>
        </div>
      </div>

      {/* Week Tabs Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto p-1.5 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-1.5">
          {WEEKS_DATA.map((w, index) => {
            const active = currentWeekIndex === index;
            return (
              <button
                key={w.label}
                type="button"
                onClick={() => setCurrentWeekIndex(index)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs font-bold text-slate-400 px-3 shrink-0 hidden md:block">
          {getWeekRangeLabel}
        </span>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-purple-500/20 border border-purple-400" />
            <span className="text-slate-300 font-medium">Ca rảnh Online (Nhấp để đặt)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-sky-500/20 border border-sky-400" />
            <span className="text-slate-300 font-medium">Ca rảnh Offline (Nhấp để đặt)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500/30 border border-amber-500" />
            <span className="text-slate-300 font-medium">Đã xếp lịch thi (Booked)</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 italic">
          * Nhấp vào ô thời gian bất kỳ để mở form đặt lịch Test Entrance nhanh
        </span>
      </div>

      {/* Main Content Grid: Schedule Table & Weekly Tests List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Schedule Grid */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800">
                <tr className="text-center font-black text-[10px] text-slate-400">
                  <th className="px-2 py-3 border-r border-slate-800 w-24 bg-slate-900">GIỜ</th>
                  {gridHeaders.map((h) => (
                    <th key={h.offset} className="px-1 py-2.5 border-r border-slate-800 min-w-[90px]">
                      <div className="text-slate-500 font-medium text-[9px]">{h.dateStr}</div>
                      <div className="text-slate-200">{h.dayName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-center">
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot} className="hover:bg-slate-900/40">
                    <td className="px-2 py-2 font-bold text-slate-400 border-r border-slate-800 bg-slate-900/70 tabular-nums">
                      {formatTime12h(slot)}
                    </td>
                    {gridHeaders.map((h) => {
                      const d = getDayDate(currentWeekIndex, h.offset);
                      const day = d.getDate();
                      const month = d.getMonth();
                      const year = d.getFullYear();

                      // Find free slot
                      const slotDoc = freeSlots.find(
                        (s) =>
                          s.day === day &&
                          s.month === month &&
                          s.year === year &&
                          s.time === slot &&
                          (s.teacherName ?? "").trim().toLowerCase() === selectedTeacher.trim().toLowerCase()
                      );

                      // Find test booking
                      const bookedCandidate = bookings.find(
                        (b) =>
                          b.day === day &&
                          b.month === month &&
                          b.year === year &&
                          b.time === slot &&
                          (b.graderName ?? "").trim().toLowerCase() === selectedTeacher.trim().toLowerCase() &&
                          b.status !== "cancelled"
                      );

                      const isBooked = !!bookedCandidate || slotDoc?.status === "booked";
                      const isFree = !!slotDoc && !isBooked;

                      let cellBg = "bg-slate-950/40 hover:bg-slate-900/60 text-slate-600";
                      let badge = null;

                      if (isBooked) {
                        cellBg = "bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500/25";
                        badge = (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-black uppercase text-amber-400 leading-tight truncate max-w-[80px]">
                              {bookedCandidate ? bookedCandidate.candidateName.split(" ").pop() : "BOOKED"}
                            </span>
                            <span className="text-[8px] text-amber-500/90 font-mono">
                              {bookedCandidate?.type === "writing" ? "Writing" : "Speaking"}
                            </span>
                          </div>
                        );
                      } else if (isFree) {
                        const isOffline = slotDoc.type?.includes("offline");
                        cellBg = isOffline
                          ? "bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25 font-bold cursor-pointer"
                          : "bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25 font-bold cursor-pointer";
                        badge = (
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            {isOffline ? "🏫 OFF" : "🌐 ON"}
                          </span>
                        );
                      }

                      return (
                        <td
                          key={h.offset}
                          onClick={() => handleSlotClick(h.offset, slot, slotDoc)}
                          className={`p-1.5 border-r border-slate-800/80 transition-all select-none cursor-pointer ${cellBg}`}
                          title={
                            isBooked
                              ? `Đã đặt: ${bookedCandidate?.candidateName || "Học viên"} (${bookedCandidate?.type || "Entrance"})`
                              : isFree
                              ? `Ca rảnh ${slotDoc?.type || "Online"} của ${selectedTeacher}. Nhấp để đặt lịch thi.`
                              : `Nhấp để xếp lịch ca ${slot} ngày ${h.dateStr}`
                          }
                        >
                          <div className="flex items-center justify-center min-h-[22px]">
                            {badge || <span className="opacity-10 text-[10px]">•</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Weekly Entrance Tests List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Ca Test Tuần Này</h3>
                <p className="text-[11px] text-slate-500">Các ca thi của {selectedTeacher}</p>
              </div>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-black text-amber-400">
                {weeklyTests.length} ca
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500 text-center py-8">Đang tải ca thi...</p>
            ) : weeklyTests.length === 0 ? (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <div className="text-2xl">📋</div>
                <div className="text-xs font-bold">Chưa có ca Test Entrance nào</div>
                <p className="text-[11px] text-slate-600">
                  Nhấp vào ca rảnh trên bảng bên trái để xếp lịch thi cho khách.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {weeklyTests.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-white">{t.candidateName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{t.candidatePhone}</div>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                          t.status === "graded"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {t.status === "graded" ? "Đã có điểm" : "Đã xếp lịch"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span className="font-bold text-amber-400">
                        {t.time} • {t.day}/{t.month + 1}
                      </span>
                      <span className="font-semibold text-slate-300">
                        {t.type === "writing" ? "Writing Entrance" : "Speaking Entrance"}
                      </span>
                    </div>

                    {/* Scores display if graded */}
                    {(t.scoreSpeaking || t.scoreWriting) && (
                      <div className="flex items-center gap-3 pt-1">
                        {t.scoreSpeaking && (
                          <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            Speaking: <span className="font-black text-white">{t.scoreSpeaking}</span>
                          </div>
                        )}
                        {t.scoreWriting && (
                          <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            Writing: <span className="font-black text-white">{t.scoreWriting}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalState.isOpen && (
        <EntranceBookingModal
          initialGrader={bookingModalState.grader}
          initialDate={bookingModalState.date}
          initialTime={bookingModalState.time}
          initialSlotId={bookingModalState.slotId}
          initialFormat={bookingModalState.format}
          onClose={() => setBookingModalState({ isOpen: false })}
          onSuccess={() => {
            void loadData();
          }}
        />
      )}
    </div>
  );
}
