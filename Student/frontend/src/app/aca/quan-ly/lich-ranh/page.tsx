"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { NativeSelectChevron } from "@/components/student/ui";
import {
  fetchAcaFreeSlots,
  createAcaFreeSlot,
  deleteAcaFreeSlot,
  updateAcaFreeSlot,
  type AcaFreeSlot,
} from "@/lib/acaManagementApi";
import { MOCK_TEST_TEACHER_OPTIONS } from "@/lib/mockTestTeacherNames";
import {
  refreshMockTestRequestsForAca,
  loadMockTestRequests,
  MOCK_TEST_UPDATE_EVENT,
  type MockTestRequest,
} from "@/lib/mockTestRequests";
import { fetchAcaStudents, type AcaStudent } from "@/lib/acaManagementApi";
import { getCachedAuthUser } from "@/lib/auth";
import { getGraderMeetLink, saveGraderMeetLink } from "@/lib/graderMeetLinks";

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

const BRUSH_TYPES = [
  {
    type: "Nhận ca Test speaking/ chấm writing online",
    label: "Online",
    color: "bg-[#fae8ff] hover:bg-[#f5d0fe] border-[#f5d0fe] text-[#86198f]",
    legendColor: "bg-[#fae8ff] border-[#f5d0fe]",
    badgeText: "ON"
  },
  {
    type: "Nhận ca Test speaking/ chấm writing offline",
    label: "Offline",
    color: "bg-[#dbeafe] hover:bg-[#bfdbfe] border-[#bfdbfe] text-[#1e40af]",
    legendColor: "bg-[#dbeafe] border-[#bfdbfe]",
    badgeText: "OFF"
  }
];

export default function AcaLichRanhPage() {
  const [freeSlots, setFreeSlots] = useState<AcaFreeSlot[]>([]);
  const [mockRequests, setMockRequests] = useState<MockTestRequest[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & selections
  const [selectedTeacher, setSelectedTeacher] = useState<string>(MOCK_TEST_TEACHER_OPTIONS[0]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0); // Default to current week
  const [activeBrush, setActiveBrush] = useState<string>("Nhận ca Test speaking/ chấm writing online");

  const [graderMeetLink, setGraderMeetLink] = useState(() => getGraderMeetLink(selectedTeacher));

  useEffect(() => {
    setGraderMeetLink(getGraderMeetLink(selectedTeacher));
  }, [selectedTeacher]);

  const handleSaveMeetLink = (url: string) => {
    setGraderMeetLink(url);
    saveGraderMeetLink(selectedTeacher, url);
  };

  useEffect(() => {
    const loggedInUser = getCachedAuthUser();
    if (loggedInUser && (loggedInUser.role === "ACA" || loggedInUser.role === "GV")) {
      setSelectedTeacher(loggedInUser.name);
    }
  }, []);

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotsData, requestsData, studentsData] = await Promise.all([
        fetchAcaFreeSlots(),
        refreshMockTestRequestsForAca(),
        fetchAcaStudents(),
      ]);
      setFreeSlots(slotsData);
      setMockRequests(requestsData);
      setStudents(studentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void sync();
    const onUpdate = () => void sync();
    window.addEventListener(MOCK_TEST_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(MOCK_TEST_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [sync]);

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

  // Cell toggle draw action
  const handleCellToggle = async (dayOffset: number, timeSlot24h: string, isChecked: boolean) => {
    const targetDate = getDayDate(currentWeekIndex, dayOffset);
    const day = targetDate.getDate();
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();

    const existing = freeSlots.find(
      (s) =>
        s.day === day &&
        s.month === month &&
        s.year === year &&
        s.time === timeSlot24h &&
        (s.teacherName ?? "").trim() === selectedTeacher.trim()
    );

    if (existing) {
      if (existing.status === "booked") {
        alert("Ca này đã có học viên đặt lịch thi, không thể sửa đổi!");
        return;
      }

      // If clicked a checked slot and the brush type is different -> overwrite paint color
      if (isChecked && existing.type !== activeBrush) {
        try {
          await updateAcaFreeSlot(existing.id, { type: activeBrush });
          setFreeSlots((prev) =>
            prev.map((s) => (s.id === existing.id ? { ...s, type: activeBrush } : s))
          );
          window.dispatchEvent(new Event("storage"));
        } catch (err: any) {
          setError("Lỗi cập nhật loại ca: " + err.message);
        }
      } else {
        // Uncheck or toggle same brush type -> delete slot
        try {
          await deleteAcaFreeSlot(existing.id);
          setFreeSlots((prev) => prev.filter((s) => s.id !== existing.id));
          window.dispatchEvent(new Event("storage"));
        } catch (err: any) {
          setError("Lỗi xóa ca: " + err.message);
        }
      }
    } else {
      // Unchecked -> create slot
      try {
        const newSlot = await createAcaFreeSlot({
          day,
          month,
          year,
          time: timeSlot24h,
          teacherName: selectedTeacher,
          status: "available",
          type: activeBrush,
        });
        setFreeSlots((prev) => [...prev, newSlot]);
        window.dispatchEvent(new Event("storage"));
      } catch (err: any) {
        setError("Lỗi tạo ca rảnh: " + err.message);
      }
    }
  };

  // Day of week column headers
  const gridHeaders = useMemo(() => {
    const daysName = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    return Array.from({ length: 7 }).map((_, i) => {
      const d = getDayDate(currentWeekIndex, i);
      const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      return {
        dateStr,
        dayName: daysName[i],
        offset: i
      };
    });
  }, [currentWeekIndex, getDayDate]);

  // Hours per day calculation
  const hoursPerDay = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = getDayDate(currentWeekIndex, i);
      const day = d.getDate();
      const month = d.getMonth();
      const year = d.getFullYear();

      const slots = freeSlots.filter(
        (s) =>
          s.day === day &&
          s.month === month &&
          s.year === year &&
          (s.teacherName ?? "").trim() === selectedTeacher.trim()
      );
      return slots.length * 0.5; // each shift is 30 mins (0.5 hour)
    });
  }, [freeSlots, currentWeekIndex, selectedTeacher, getDayDate]);

  // Total Hours this week
  const totalWeeklyHours = useMemo(() => {
    return hoursPerDay.reduce((sum, h) => sum + h, 0);
  }, [hoursPerDay]);

  // Sync scheduled speak tests for current week
  const weeklyMockTests = useMemo(() => {
    const mondayDate = getDayDate(currentWeekIndex, 0);
    mondayDate.setHours(0, 0, 0, 0);
    const sundayDate = getDayDate(currentWeekIndex, 6);
    sundayDate.setHours(23, 59, 59, 999);

    const filtered = mockRequests.filter((r) => {
      const testDate = new Date(r.year, r.month, r.day);
      const inRange = testDate >= mondayDate && testDate <= sundayDate;
      const belongsToAca =
        (r.examTeacher ?? "").trim().toLowerCase() === selectedTeacher.trim().toLowerCase() ||
        (selectedTeacher.trim().toLowerCase() === "lê nguyễn khánh thi" &&
          ((r.examTeacher ?? "").trim().toLowerCase() === "aca" ||
           (r.examTeacher ?? "").trim().toLowerCase() === "lê thị diệu linh"));
      const isApproved = r.status === "approved";
      return inRange && belongsToAca && isApproved;
    });

    return filtered.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (a.examTime ?? "").localeCompare(b.examTime ?? "");
    });
  }, [mockRequests, currentWeekIndex, selectedTeacher, getDayDate]);

  return (
    <AcaLayout>
      <AcaTopbar
        title="Lịch Rảnh Grader"
        subtitle="Bảng lịch biểu tuần cấu hình ca rảnh của Grader. Học viên đăng ký theo ca sẽ được tự động xếp lịch thi."
      />
      <main className="mx-auto max-w-7xl px-4 py-4 pb-16 md:px-6 space-y-6">
        
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Filters Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0">Nhân viên Grader:</span>
            <span className="text-xs font-black text-zinc-800 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-xl shrink-0">
              {selectedTeacher}
            </span>

            <div className="flex items-center gap-2 min-w-[240px] flex-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 shrink-0">Link Meet:</span>
              <input
                type="url"
                value={graderMeetLink}
                onChange={(e) => handleSaveMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="h-9 w-full min-w-[180px] rounded-xl border border-emerald-300 bg-emerald-50/50 px-3 text-xs font-bold text-emerald-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              />
              <a
                href={graderMeetLink}
                target="_blank"
                rel="noreferrer"
                className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-xs font-black text-white hover:bg-emerald-800 transition-all shrink-0"
              >
                Mở Meet ↗
              </a>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Tuần đang cấu hình</span>
            <span className="text-sm font-black text-[#6a5acd]">{getWeekRangeLabel}</span>
          </div>
        </div>

        {/* Brush Tool Palette */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-3">Tô màu lịch rảnh (Color Code Brush)</span>
          <div className="flex flex-wrap gap-3">
            {BRUSH_TYPES.map((b) => {
              const isActive = activeBrush === b.type;
              return (
                <button
                  key={b.type}
                  type="button"
                  onClick={() => setActiveBrush(b.type)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 border text-xs font-bold transition-all shadow-sm ${
                    isActive
                      ? "ring-2 ring-offset-1 ring-[#6a5acd] border-zinc-600 scale-[1.03]"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full border ${b.legendColor}`} />
                  <span className="text-zinc-700">{b.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[10px] text-zinc-400 italic">
            * Hướng dẫn: Chọn một cọ vẽ ở trên, sau đó nhấp vào ô grid thời gian ở dưới để sơn màu/đăng ký ca. Bỏ tích ô đó để xóa ca rảnh.
          </p>
        </div>

        {/* Spreadsheet Workspace layout */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
          
          {/* LEFT: Grid sheet table */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-center font-bold text-zinc-600 text-[10px]">
                      <th className="px-2 py-3 border-r border-zinc-200 min-w-[90px]">GIỜ SLOTS</th>
                      {gridHeaders.map((h) => (
                        <th key={h.offset} className="px-1 py-2 border-r border-zinc-200 min-w-[95px]">
                          <div className="text-zinc-400 font-medium text-[9px]">{h.dateStr}</div>
                          <div>{h.dayName}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-center">
                    {TIME_SLOTS.map((slot) => (
                      <tr key={slot} className="hover:bg-zinc-50/30">
                        <td className="px-2 py-1.5 font-bold text-zinc-500 border-r border-zinc-200 bg-zinc-50/50 tabular-nums">
                          {formatTime12h(slot)}
                        </td>
                        {gridHeaders.map((h) => {
                          const d = getDayDate(currentWeekIndex, h.offset);
                          const day = d.getDate();
                          const month = d.getMonth();
                          const year = d.getFullYear();

                          const slotDoc = freeSlots.find(
                            (s) =>
                              s.day === day &&
                              s.month === month &&
                              s.year === year &&
                              s.time === slot &&
                              (s.teacherName ?? "").trim() === selectedTeacher.trim()
                          );

                          const isChecked = !!slotDoc;
                          const isBooked = slotDoc?.status === "booked";
                          
                          // Style based on brush type
                          let cellStyle = "bg-white border-dashed border-zinc-100 hover:bg-zinc-50/50";
                          let labelText = "";
                          if (isChecked && slotDoc.type) {
                            const foundBrush = BRUSH_TYPES.find((b) => b.type === slotDoc.type);
                            cellStyle = foundBrush ? foundBrush.color : "bg-zinc-100 border-zinc-200 text-zinc-800";
                            labelText = foundBrush ? foundBrush.badgeText : "ON";
                          }

                          return (
                            <td
                              key={h.offset}
                              onClick={() => handleCellToggle(h.offset, slot, isChecked)}
                              className={`p-1 border-r border-zinc-200 transition-all select-none cursor-pointer text-center relative ${cellStyle}`}
                            >
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  disabled={isBooked}
                                  className="h-3 w-3 rounded text-primary focus:ring-primary/20 border-zinc-300 cursor-pointer disabled:cursor-not-allowed"
                                />
                                {isChecked && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black tracking-wider uppercase leading-none opacity-80">
                                    {labelText}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Hours/Day footer row */}
                    <tr className="bg-zinc-50 font-bold text-zinc-700 text-[10px] border-t border-zinc-300">
                      <td className="px-2 py-3 border-r border-zinc-200 bg-zinc-100 font-extrabold text-left uppercase">Hours/Day</td>
                      {hoursPerDay.map((h, idx) => (
                        <td key={idx} className="px-1 py-3 border-r border-zinc-200 text-center font-extrabold text-zinc-900 text-xs bg-zinc-100/50 tabular-nums">
                          {h > 0 ? h : 0}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Excel Tabs */}
              <div className="bg-zinc-100 border-t border-zinc-200 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-2">Bảng tính:</span>
                {WEEKS_DATA.map((w, index) => {
                  const active = currentWeekIndex === index;
                  return (
                    <button
                      key={w.label}
                      type="button"
                      onClick={() => setCurrentWeekIndex(index)}
                      className={`px-3 py-1 rounded-md text-[10px] font-extrabold transition-all border shadow-xs ${
                        active
                          ? "bg-[#6a5acd] text-white border-[#5b4ec0]"
                          : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Hours Section */}
            <div className="flex justify-between items-center bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Quy đổi định lượng</h3>
                <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed max-w-md">
                  * Quy đổi tiêu chuẩn Grader: 1 ca test Speaking = 30p (0.5h) // 1 bài Writing đầy đủ = 60p (1h) // 1 ca dạy/học thử = 60p (1h).
                </p>
              </div>
              <div className="text-center border-l border-zinc-100 pl-6 shrink-0 min-w-[120px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">TOTAL HOURS</span>
                <span className="text-3xl font-black text-[#6a5acd] tabular-nums mt-1 block">{totalWeeklyHours}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Speaking test spreadsheet table */}
          <div className="lg:col-span-5 space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
                  Speaking Test Schedule
                </h2>
                <a href="#test-link" className="text-[10px] text-primary font-bold hover:underline">Link test speak</a>
              </div>

              {loading ? (
                <p className="text-xs text-zinc-500 text-center py-6">Đang tải lịch thi...</p>
              ) : (
                <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-center font-bold text-zinc-600 text-[10px]">
                        <th className="px-1 py-2 border-r border-zinc-200 bg-zinc-100/50 w-8"></th>
                        <th className="px-2 py-2 border-r border-zinc-200">HÌNH THỨC</th>
                        <th className="px-2 py-2 border-r border-zinc-200">NGÀY</th>
                        <th className="px-2 py-2 border-r border-zinc-200">GIỜ</th>
                        <th className="px-2 py-2 border-r border-zinc-200">TÊN</th>
                        <th className="px-2 py-2 border-r border-zinc-200">BCB</th>
                        <th className="px-2 py-2 border-r border-zinc-200">DẠNG</th>
                        <th className="px-2 py-2 border-r border-zinc-200">LINK ĐỀ</th>
                        <th className="px-2 py-2 border-r border-zinc-200">ĐIỂM S</th>
                        <th className="px-2 py-2 border-r border-zinc-200">TÌNH TRẠNG</th>
                        <th className="px-2 py-2">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-center font-medium">
                      {(() => {
                        const rows = [...weeklyMockTests];
                        while (rows.length < 10) {
                          rows.push(null as any);
                        }
                        
                        return rows.map((req, idx) => {
                          if (!req) {
                            // Render empty placeholder row
                            return (
                              <tr key={`empty-${idx}`} className="h-10 hover:bg-zinc-50/20">
                                <td className="border-r border-zinc-200 bg-zinc-50 font-bold text-zinc-400 text-[10px] py-2">
                                  {idx + 1}
                                </td>
                                <td className="border-r border-zinc-200"></td>
                                <td className="border-r border-zinc-200"></td>
                                <td className="border-r border-zinc-200"></td>
                                <td className="border-r border-zinc-200"></td>
                                <td className="border-r border-zinc-200"></td>
                                <td className="border-r border-zinc-200"></td>
                                <td className="border-r border-zinc-200"></td>
                                <td className="border-r border-zinc-200"></td>
                                <td className="border-r border-zinc-200"></td>
                                <td></td>
                              </tr>
                            );
                          }

                          const studentInfo = students.find((s) => s.id === req.studentId);
                          const isOnline = !req.examTime?.includes("Offline");
                          
                          // Handle inline edit save
                          const handleSaveValue = async (field: "score" | "examLink", val: string) => {
                            try {
                              const updatedPayload = {
                                score: field === "score" ? val : (req.score || "—"),
                                examLink: field === "examLink" ? val : (req.examLink || "—")
                              };
                              // Ensure values are not empty for API
                              if (updatedPayload.score === "—") updatedPayload.score = "0";
                              if (updatedPayload.examLink === "—") updatedPayload.examLink = "https://";
                              
                              const { submitMockTestSpeakingResult } = await import("@/lib/mockTestRequests");
                              await submitMockTestSpeakingResult(req.id, selectedTeacher, updatedPayload);
                              void sync();
                            } catch (err: any) {
                              alert("Lỗi lưu điểm/link: " + err.message);
                            }
                          };

                          const handleStatusChange = async (newStatus: "Tested" | "Canceled" | "Scheduled") => {
                            try {
                              if (newStatus === "Canceled") {
                                const { rejectMockTestRequest } = await import("@/lib/mockTestRequests");
                                await rejectMockTestRequest(req.id);
                              } else {
                                // For Tested or Scheduled, update status via mockTestRequests
                                const { approveMockTestRequest } = await import("@/lib/mockTestRequests");
                                await approveMockTestRequest(req.id, {
                                  examTime: req.examTime || "",
                                  examTeacher: req.examTeacher || selectedTeacher
                                });
                                if (newStatus === "Tested" && !req.score) {
                                  // Prompt for score if tested
                                  const score = prompt("Nhập điểm Speaking (S):", "5");
                                  if (score) {
                                    const { submitMockTestSpeakingResult } = await import("@/lib/mockTestRequests");
                                    await submitMockTestSpeakingResult(req.id, selectedTeacher, {
                                      score,
                                      examLink: req.examLink || "https://"
                                    });
                                  }
                                }
                              }
                              void sync();
                            } catch (err: any) {
                              alert("Lỗi cập nhật trạng thái: " + err.message);
                            }
                          };

                          const isTested = !!req.score;
                          const isCanceled = req.status === "rejected";
                          const currentStatus = isTested ? "Tested" : (isCanceled ? "Canceled" : "Scheduled");

                          return (
                            <tr key={req.id} className="h-10 hover:bg-zinc-50/30 text-zinc-700">
                              {/* Index */}
                              <td className="border-r border-zinc-200 bg-zinc-50 font-bold text-zinc-500 text-[10px] py-1.5">
                                {idx + 1}
                              </td>
                              
                              {/* HÌNH THỨC */}
                              <td className="border-r border-zinc-200 font-extrabold text-zinc-900 text-[10px] uppercase">
                                {isOnline ? "ONL" : "OFF"}
                              </td>
                              
                              {/* NGÀY */}
                              <td className="border-r border-zinc-200 font-bold text-zinc-500 tabular-nums">
                                {req.day}/{req.month + 1}
                              </td>
                              
                              {/* GIỜ */}
                              <td className="border-r border-zinc-200 font-black text-zinc-900 tabular-nums">
                                {req.examTime?.split(" ")[0] || "—"}
                              </td>
                              
                              {/* TÊN */}
                              <td className="border-r border-zinc-200 text-left px-2 font-bold truncate max-w-[120px]" title={req.studentName}>
                                {req.studentName}
                              </td>
                              
                              {/* BCB */}
                              <td className="border-r border-zinc-200 font-medium text-[9px] text-zinc-400 select-all cursor-copy truncate max-w-[90px]" title={req.studentId}>
                                {req.studentId}
                              </td>
                              
                              {/* DẠNG */}
                              <td className="border-r border-zinc-200">
                                <span className="inline-flex rounded px-1.5 py-0.5 text-[9px] font-black uppercase bg-[#fae8ff] border border-[#f5d0fe] text-[#86198f]">
                                  Support
                                </span>
                              </td>
                              
                              {/* LINK ĐỀ */}
                              <td className="border-r border-zinc-200 px-1">
                                <input
                                  type="text"
                                  defaultValue={req.examLink || ""}
                                  placeholder="Dán link..."
                                  onBlur={(e) => handleSaveValue("examLink", e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveValue("examLink", e.currentTarget.value);
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className="w-full bg-transparent border-0 hover:bg-zinc-50 focus:bg-white text-[10px] font-bold text-primary underline truncate text-center outline-none focus:ring-1 focus:ring-primary/20 rounded py-0.5"
                                />
                              </td>
                              
                              {/* ĐIỂM S */}
                              <td className="border-r border-zinc-200 px-1 w-14">
                                <input
                                  type="text"
                                  defaultValue={req.score || ""}
                                  placeholder="—"
                                  onBlur={(e) => handleSaveValue("score", e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveValue("score", e.currentTarget.value);
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className="w-full bg-transparent border-0 hover:bg-zinc-50 focus:bg-white text-[11px] font-black text-center outline-none focus:ring-1 focus:ring-primary/20 rounded py-0.5"
                                />
                              </td>
                              
                              {/* TÌNH TRẠNG */}
                              <td className="border-r border-zinc-200 px-1 w-24">
                                <select
                                  value={currentStatus}
                                  onChange={(e) => handleStatusChange(e.target.value as any)}
                                  className={`w-full text-center border-0 text-[9px] font-black uppercase rounded py-1 px-1 outline-none cursor-pointer appearance-none ${
                                    currentStatus === "Tested"
                                      ? "bg-[#dcfce7] border border-[#bbf7d0] text-[#166534]"
                                      : currentStatus === "Canceled"
                                        ? "bg-[#fee2e2] border border-[#fecaca] text-[#991b1b]"
                                        : "bg-amber-50 border border-amber-100 text-amber-700"
                                  }`}
                                >
                                  <option value="Scheduled">Scheduled</option>
                                  <option value="Tested">Tested</option>
                                  <option value="Canceled">Canceled</option>
                                </select>
                              </td>
                              
                              {/* Note */}
                              <td className="px-1 text-zinc-400 font-bold text-[9px] truncate max-w-[80px]" title={req.skill}>
                                {req.skill.includes("·") ? req.skill.split("·")[1].trim() : "—"}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

        </div>

      </main>
    </AcaLayout>
  );
}
