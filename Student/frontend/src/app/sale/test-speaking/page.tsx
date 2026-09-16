"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelEntranceTestBooking,
  ENTRANCE_BOOKINGS_UPDATE_EVENT,
  ENTRANCE_STATUS_LABELS,
  listEntranceTestBookings,
  updateEntranceTestBooking,
  type EntranceTestBooking,
  type EntranceTestStatus,
  type EntranceTestType,
} from "@/lib/entranceTestBookings";
import { NativeSelectChevron } from "@/components/student/ui";
import { confirmDialog } from "@/components/shared/ConfirmDialog";
import { EntranceBookingModal } from "@/components/sale/EntranceBookingModal";
import {
  getMockTestTeacherOptions,
  MOCK_TEST_TEACHER_OPTIONS_EVENT,
  syncMockTestTeacherOptions,
} from "@/lib/mockTestTeacherNames";
import { fetchAcaFreeSlots, type AcaFreeSlot } from "@/lib/acaManagementApi";
import { getGraderMeetLink } from "@/lib/graderMeetLinks";

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

function formatDateDisplay(isoDate: string, time: string) {
  try {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y} Lúc ${time}`;
  } catch {
    return `${isoDate} ${time}`;
  }
}

function formatDateShort(isoDate: string) {
  try {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return isoDate;
  }
}

function formatTime12h(t24: string) {
  const [hStr, mStr] = t24.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${ampm}`;
}

function statusBadge(status: EntranceTestStatus) {
  return {
    scheduled: "bg-sky-50 text-sky-700 border-sky-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    graded: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }[status];
}

function SaleTestSpeakingPage() {
  const activeTab = "speaking" as const;

  // State
  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);
  const [bookings, setBookings] = useState<EntranceTestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherOptions, setTeacherOptions] = useState<string[]>(() => getMockTestTeacherOptions());
  const [selectedTeacher, setSelectedTeacher] = useState<string>(getMockTestTeacherOptions()[0] || "Grader");
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);

  // Filters for bottom table
  const [statusFilter, setStatusFilter] = useState<"all" | EntranceTestStatus>("all");
  const [graderFilter, setGraderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modals
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    type: EntranceTestType;
    grader?: string;
    date?: string;
    time?: string;
    slotId?: string;
    format?: "online" | "offline";
  }>({ isOpen: false, type: "speaking" });

  const [gradingBooking, setGradingBooking] = useState<EntranceTestBooking | null>(null);
  const [scoreSpeakingDraft, setScoreSpeakingDraft] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const graderMeetLink = useMemo(() => {
    return getGraderMeetLink(selectedTeacher);
  }, [selectedTeacher]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsData, bookingsData] = await Promise.all([
        fetchAcaFreeSlots(),
        listEntranceTestBookings(),
      ]);
      setFreeSlots(slotsData);
      setBookings(bookingsData);
    } catch {
      // ignore
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

  useEffect(() => {
    void syncMockTestTeacherOptions().then((rows) => {
      setTeacherOptions(rows);
      setSelectedTeacher((current) => current || rows[0] || "Grader");
    });
    const onTeachers = () => {
      const rows = getMockTestTeacherOptions();
      setTeacherOptions(rows);
      setSelectedTeacher((current) => current || rows[0] || "Grader");
    };
    window.addEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onTeachers);
    return () => window.removeEventListener(MOCK_TEST_TEACHER_OPTIONS_EVENT, onTeachers);
  }, []);

  // Helper date for current week offset
  const getDayDate = useCallback((weekIdx: number, dayOffset: number) => {
    const start = WEEKS_DATA[weekIdx].startDate;
    const d = new Date(start);
    d.setDate(start.getDate() + dayOffset);
    return d;
  }, []);

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

  // Available free slots count in current week
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

  // Bookings list per type
  const speakingList = useMemo(() => {
    return bookings.filter((b) => b.type === "speaking" || b.type === "both");
  }, [bookings]);

  const writingList = useMemo(() => {
    return bookings.filter((b) => b.type === "writing" || b.type === "both");
  }, [bookings]);

  // Weekly bookings for right panel in active tab
  const weeklyTestsForSelectedGrader = useMemo(() => {
    const monday = getDayDate(currentWeekIndex, 0);
    monday.setHours(0, 0, 0, 0);
    const sunday = getDayDate(currentWeekIndex, 6);
    sunday.setHours(23, 59, 59, 999);

    const source = activeTab === "speaking" ? speakingList : writingList;
    return source.filter((b) => {
      const d = new Date(b.year, b.month, b.day);
      const inWeek = d >= monday && d <= sunday;
      const matchGrader = (b.graderName ?? "").trim().toLowerCase() === selectedTeacher.trim().toLowerCase();
      return inWeek && matchGrader && b.status !== "cancelled";
    });
  }, [activeTab, speakingList, writingList, currentWeekIndex, selectedTeacher, getDayDate]);

  // Filtered List for bottom table
  const currentList = activeTab === "speaking" ? speakingList : writingList;

  const filteredBottomTable = useMemo(() => {
    let list = currentList;

    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }

    if (graderFilter !== "all") {
      list = list.filter((b) => (b.graderName ?? "").trim().toLowerCase() === graderFilter.trim().toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.candidateName.toLowerCase().includes(q) ||
          b.candidatePhone.includes(q) ||
          (b.candidateEmail && b.candidateEmail.toLowerCase().includes(q)) ||
          b.graderName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [currentList, statusFilter, graderFilter, search]);

  // Click slot on schedule grid
  const handleSlotClick = (dayOffset: number, timeSlot: string, slotDoc?: AcaFreeSlot) => {
    const targetDate = getDayDate(currentWeekIndex, dayOffset);
    const isoDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;
    const isOffline = slotDoc?.type?.includes("offline");

    setBookingModalState({
      isOpen: true,
      type: activeTab,
      grader: selectedTeacher,
      date: isoDate,
      time: timeSlot,
      slotId: slotDoc?.id,
      format: isOffline ? "offline" : "online",
    });
  };

  const handleCancel = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: "Hủy ca Speaking",
      message: `Bạn có chắc chắn muốn hủy ca Speaking của học viên "${name}" không?`,
      confirmText: "Đồng ý hủy",
      cancelText: "Giữ lại",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await cancelEntranceTestBooking(id);
      void loadData();
    } catch (err: any) {
      alert("Hủy ca thất bại: " + err.message);
    }
  };

  const openGradingModal = (b: EntranceTestBooking) => {
    setGradingBooking(b);
    setScoreSpeakingDraft(b.scoreSpeaking || "");
    setFeedbackDraft(b.feedback || "");
  };

  const handleSaveGrade = async () => {
    if (!gradingBooking) return;
    setSavingGrade(true);
    try {
      await updateEntranceTestBooking(gradingBooking.id, {
        scoreSpeaking: scoreSpeakingDraft.trim() || undefined,
        feedback: feedbackDraft.trim() || undefined,
        status: scoreSpeakingDraft.trim() ? "graded" : gradingBooking.status,
      });
      setGradingBooking(null);
      void loadData();
    } catch (err: any) {
      alert("Lưu điểm thất bại: " + err.message);
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-4">
        <h1 className="text-xl font-black text-zinc-900">
          Lịch Rảnh & Đặt Lịch Test Speaking Entrance
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5 font-medium">
          Tra cứu ca rảnh theo tuần của Grader, nhấp vào ô lịch để xếp ca phỏng vấn Speaking 1-1
        </p>
      </div>

      {/* ─── SPEAKING: lịch rảnh + chọn Grader ─── */}
      {activeTab === "speaking" && (
        <>
      {/* ─── SECTION 1: GRADER SELECTOR & WEEK BAR ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft">
        {/* Left: Grader Selector */}
        <div className="lg:col-span-4 flex items-center gap-3">
          <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider shrink-0">Grader:</span>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-primary cursor-pointer shadow-xs"
          >
            {teacherOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Center: Grader Meet Link */}
        <div className="lg:col-span-5 flex items-center gap-2">
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider shrink-0">Meet:</span>
          <div className="flex-1 text-xs text-zinc-600 font-mono bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 truncate">
            {graderMeetLink || "Chưa cập nhật link Meet"}
          </div>
          {graderMeetLink && (
            <a
              href={graderMeetLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[11px] font-black text-white transition-all shrink-0 shadow-xs"
            >
              Mở Meet ↗
            </a>
          )}
        </div>

        {/* Right: Slots Count & Top Action Button */}
        <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-3 text-right">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ca còn rảnh</span>
            <span className="text-sm font-black text-primary">{availableSlotsCount} ca ({availableSlotsCount * 0.5}h)</span>
          </div>
        </div>
      </div>

      {/* Week Tabs Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto p-1.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-1.5">
          {WEEKS_DATA.map((w, index) => {
            const active = currentWeekIndex === index;
            return (
              <button
                key={w.label}
                type="button"
                onClick={() => setCurrentWeekIndex(index)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? activeTab === "speaking"
                      ? "bg-primary text-white font-black shadow-sm"
                      : "bg-sky-600 text-white font-black shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs font-bold text-zinc-500 px-3 shrink-0 hidden md:block">
          {WEEKS_DATA[currentWeekIndex].labelFull}
        </span>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#fae8ff] border border-[#f5d0fe]" />
            <span className="text-zinc-700 font-medium">Ca rảnh Online (Nhấp để đặt)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#dbeafe] border border-[#bfdbfe]" />
            <span className="text-zinc-700 font-medium">Ca rảnh Offline (Nhấp để đặt)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-100 border border-amber-300" />
            <span className="text-zinc-700 font-medium">Đã xếp lịch thi (Booked)</span>
          </div>
        </div>
        <span className="text-[11px] text-zinc-400 italic">
          * Nhấp vào ô thời gian bất kỳ để mở form đặt lịch {activeTab === "speaking" ? "Speaking" : "Writing"} nhanh
        </span>
      </div>

      {/* ─── SECTION 2: INTERACTIVE CALENDAR GRID & WEEKLY TESTS LIST ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Schedule Grid */}
        <div className="lg:col-span-8 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-zinc-50 border-b border-zinc-200">
                <tr className="text-center font-black text-[10px] text-zinc-500">
                  <th className="px-2 py-3 border-r border-zinc-200 w-24 bg-zinc-50">GIỜ</th>
                  {gridHeaders.map((h) => (
                    <th key={h.offset} className="px-1 py-2.5 border-r border-zinc-200 min-w-[90px]">
                      <div className="text-zinc-400 font-medium text-[9px]">{h.dateStr}</div>
                      <div className="text-zinc-700">{h.dayName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-center">
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot} className="hover:bg-zinc-50/40">
                    <td className="px-2 py-2 font-bold text-zinc-500 border-r border-zinc-200 bg-zinc-50/70 tabular-nums">
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

                      let cellBg = "bg-white hover:bg-zinc-50 text-zinc-300";
                      let badge = null;

                      if (isBooked) {
                        cellBg = "bg-amber-50 border-amber-200 text-amber-800 font-bold hover:bg-amber-100/60";
                        badge = (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-black uppercase text-amber-900 leading-tight truncate max-w-[80px]">
                              {bookedCandidate ? bookedCandidate.candidateName.split(" ").pop() : "BOOKED"}
                            </span>
                            <span className="text-[8px] text-amber-700 font-mono">
                              {bookedCandidate?.type === "writing" ? "Writing" : "Speaking"}
                            </span>
                          </div>
                        );
                      } else if (isFree) {
                        const isOffline = slotDoc.type?.includes("offline");
                        cellBg = isOffline
                          ? "bg-[#dbeafe] border-[#bfdbfe] text-[#1e40af] hover:bg-[#bfdbfe] font-bold cursor-pointer"
                          : "bg-[#fae8ff] border-[#f5d0fe] text-[#86198f] hover:bg-[#f5d0fe] font-bold cursor-pointer";
                        badge = (
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            {isOffline ? "OFF" : "ON"}
                          </span>
                        );
                      }

                      return (
                        <td
                          key={h.offset}
                          onClick={() => handleSlotClick(h.offset, slot, slotDoc)}
                          className={`p-1.5 border-r border-zinc-200 transition-all select-none cursor-pointer ${cellBg}`}
                          title={
                            isBooked
                              ? `Đã đặt: ${bookedCandidate?.candidateName || "Học viên"} (${bookedCandidate?.type || "Entrance"})`
                              : isFree
                              ? `Ca rảnh ${slotDoc?.type || "Online"} của ${selectedTeacher}. Nhấp để đặt lịch thi.`
                              : `Nhấp để xếp lịch ca ${slot} ngày ${h.dateStr}`
                          }
                        >
                          <div className="flex items-center justify-center min-h-[22px]">
                            {badge || <span className="opacity-15 text-[10px]">•</span>}
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900">
                  {activeTab === "speaking" ? "Ca Test Speaking Tuần Này" : "Bài Writing Giao Tuần Này"}
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">Hồ sơ của {selectedTeacher}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black border ${
                activeTab === "speaking" ? "bg-primary/10 border-primary/20 text-primary" : "bg-sky-50 border-sky-200 text-sky-700"
              }`}>
                {weeklyTestsForSelectedGrader.length} hồ sơ
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-zinc-400 text-center py-8">Đang tải ca thi...</p>
            ) : weeklyTestsForSelectedGrader.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 space-y-2">
                <div className="text-xs font-bold text-zinc-700">Chưa có ca nào trong tuần này</div>
                <p className="text-[11px] text-zinc-400">
                  Nhấp vào ca rảnh trên bảng bên trái để đặt lịch cho học viên.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {weeklyTestsForSelectedGrader.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-zinc-900">{t.candidateName}</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{t.candidatePhone}</div>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                          t.status === "graded"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {t.status === "graded" ? "Đã có điểm" : "Đã xếp lịch"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200">
                      <span className="font-bold text-primary">
                        {t.time} • {t.day}/{t.month + 1}
                      </span>
                      <span className="font-semibold text-zinc-700">
                        {t.type === "writing" ? "Writing Entrance" : "Speaking Entrance"}
                      </span>
                    </div>

                    {/* Scores display if graded */}
                    {(t.scoreSpeaking || t.scoreWriting) && (
                      <div className="flex items-center gap-2 pt-1">
                        {t.scoreSpeaking && (
                          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Speaking: <span className="font-black text-zinc-900">{t.scoreSpeaking}</span>
                          </div>
                        )}
                        {t.scoreWriting && (
                          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Writing: <span className="font-black text-zinc-900">{t.scoreWriting}</span>
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
        </>
      )}

      {/* ─── SECTION 3: FULL MANAGEMENT TABLE PER SKILL ─── */}
      <div className="space-y-4 pt-6 border-t border-zinc-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-zinc-900">
              {activeTab === "speaking" ? "Danh Sách Quản Lý Ca Test Speaking" : "Danh sách bài Writing Entrance đã nộp"}
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Theo dõi tình trạng bài làm, cập nhật điểm số và kết quả từ Grader
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="scheduled">Đã xếp lịch / Chờ chấm</option>
              <option value="in_progress">Đang thi / Đang chấm</option>
              <option value="graded">Đã có điểm</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <select
              value={graderFilter}
              onChange={(e) => setGraderFilter(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              <option value="all">Tất cả Grader</option>
              {teacherOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <div className="relative min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, SĐT..."
                className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 pl-8 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-primary transition-all shadow-xs font-medium"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs font-bold">Đang tải danh sách...</div>
          ) : filteredBottomTable.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="text-sm font-bold text-zinc-800">Chưa có hồ sơ nào phù hợp</div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Nhấp vào bảng lịch rảnh phía trên để đặt lịch cho học viên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3.5">Ứng viên / Khách</th>
                    <th className="px-4 py-3.5">Grader chấm</th>
                    <th className="px-4 py-3.5">{activeTab === "speaking" ? "Thời gian thi Speaking" : "Ngày nộp"}</th>
                    <th className="px-4 py-3.5">{activeTab === "speaking" ? "Hình thức & Phòng thi" : "Link bài làm"}</th>
                    <th className="px-4 py-3.5 text-center">{activeTab === "speaking" ? "Điểm Speaking" : "Điểm Writing"}</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {filteredBottomTable.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Candidate */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-900 text-sm leading-tight">{b.candidateName}</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{b.candidatePhone}</div>
                      </td>

                      {/* Grader */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-900">{b.graderName}</div>
                        <div className="text-[10px] text-zinc-400 font-medium">
                          {activeTab === "speaking" ? "Giám khảo Speaking" : "Grader (tự phân)"}
                        </div>
                      </td>

                      {/* Date Time */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-900 tabular-nums">
                          {activeTab === "speaking" ? formatDateDisplay(b.date, b.time) : formatDateShort(b.date)}
                        </div>
                        {b.note && <div className="text-[10px] text-zinc-400 italic mt-0.5 truncate max-w-[150px]" title={b.note}>{b.note}</div>}
                      </td>

                      {/* Details / Links */}
                      <td className="px-4 py-3.5 space-y-1">
                        {activeTab === "speaking" ? (
                          <>
                            <span
                              className={`inline-flex rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                b.format === "online"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {b.format === "online" ? "Online" : "Offline TT"}
                            </span>
                            {b.meetLink && (
                              <div>
                                <a
                                  href={b.meetLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                                >
                                  Google Meet ↗
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {b.submissionLink ? (
                              <a
                                href={b.submissionLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors"
                              >
                                <span>Bài nộp học viên ↗</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-zinc-400 italic">Chưa đính kèm bài nộp</span>
                            )}
                            {b.examLink && (
                              <div>
                                <a
                                  href={b.examLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 hover:underline truncate max-w-[150px] inline-block"
                                  title={b.examLink}
                                >
                                  Đề bài Writing ↗
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Scores */}
                      <td className="px-4 py-3.5 text-center">
                        {activeTab === "speaking" ? (
                          b.scoreSpeaking ? (
                            <div className="inline-flex items-center gap-1.5 text-xs font-black text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-xl">
                              <span>Band</span>
                              <span className="text-sm">{b.scoreSpeaking}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openGradingModal(b)}
                              className="text-[10px] font-bold text-primary hover:underline cursor-pointer bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg transition-all"
                            >
                              + Nhập điểm
                            </button>
                          )
                        ) : (
                          b.scoreWriting ? (
                            <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                              <span>Band</span>
                              <span className="text-sm">{b.scoreWriting}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openGradingModal(b)}
                              className="text-[10px] font-bold text-sky-700 hover:underline cursor-pointer bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-1 rounded-lg transition-all"
                            >
                              + Nhập điểm
                            </button>
                          )
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${statusBadge(b.status)}`}>
                          {ENTRANCE_STATUS_LABELS[b.status]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openGradingModal(b)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Cập nhật điểm & nhận xét"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          {b.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleCancel(b.id, b.candidateName)}
                              className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hủy ca thi"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── QUICK GRADING MODAL ─── */}
      {gradingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setGradingBooking(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900">
                  {activeTab === "speaking" ? "Nhập Điểm Speaking Entrance" : "Nhập Điểm Writing Entrance"}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                  Ứng viên: <span className="text-primary font-bold">{gradingBooking.candidateName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingBooking(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Điểm Speaking (Band)</label>
                <input
                  type="text"
                  value={scoreSpeakingDraft}
                  onChange={(e) => setScoreSpeakingDraft(e.target.value)}
                  placeholder="VD: 6.5"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nhận xét / Feedback</label>
                <textarea
                  rows={3}
                  value={feedbackDraft}
                  onChange={(e) => setFeedbackDraft(e.target.value)}
                  placeholder="Ghi chú nhận xét từ Grader..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-primary focus:bg-white resize-none font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setGradingBooking(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingGrade}
                onClick={handleSaveGrade}
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 shadow-sm cursor-pointer ${
                  activeTab === "speaking" ? "bg-primary hover:bg-[#6a5acd]" : "bg-sky-600 hover:bg-sky-700"
                }`}
              >
                {savingGrade ? "Đang lưu..." : "Lưu Điểm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BOOKING MODAL (PRESET TO ACTIVE TAB TYPE) ─── */}
      {bookingModalState.isOpen && (
        <EntranceBookingModal
          lockType
          initialType="speaking"
          initialGrader={bookingModalState.grader}
          initialDate={bookingModalState.date}
          initialTime={bookingModalState.time}
          initialSlotId={bookingModalState.slotId}
          initialFormat={bookingModalState.format}
          onClose={() => setBookingModalState((prev) => ({ ...prev, isOpen: false }))}
          onSuccess={() => {
            void loadData();
          }}
        />
      )}
    </div>
  );
}

export default SaleTestSpeakingPage;
