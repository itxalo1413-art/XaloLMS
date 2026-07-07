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
  type MockTestRequest,
} from "@/lib/mockTestRequests";
import { fetchAcaStudents, type AcaStudent } from "@/lib/acaManagementApi";

const WEEKS_DATA = [
  { label: "[JUNE/Week 1]", labelFull: "Week 1 (01/Jun - 07/Jun/2026)", startDate: new Date(2026, 5, 1) },
  { label: "[JUNE/Week 2]", labelFull: "Week 2 (08/Jun - 14/Jun/2026)", startDate: new Date(2026, 5, 8) },
  { label: "[JUNE/Week 3]", labelFull: "Week 3 (15/Jun - 21/Jun/2026)", startDate: new Date(2026, 5, 15) },
  { label: "[JUNE/Week 4]", labelFull: "Week 4 (22/Jun - 28/Jun/2026)", startDate: new Date(2026, 5, 22) },
  { label: "[JUNE/Week 5]", labelFull: "Week 5 (29/Jun - 05/Jul/2026)", startDate: new Date(2026, 5, 29) },
];

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
  },
  {
    type: "Test support",
    label: "Test Support",
    color: "bg-[#fee2e2] hover:bg-[#fecaca] border-[#fecaca] text-[#991b1b]",
    legendColor: "bg-[#fee2e2] border-[#fecaca]",
    badgeText: "SUP"
  },
  {
    type: "Task ACA",
    label: "Task ACA",
    color: "bg-[#ffedd5] hover:bg-[#fed7aa] border-[#fed7aa] text-[#9a3412]",
    legendColor: "bg-[#ffedd5] border-[#fed7aa]",
    badgeText: "TSK"
  },
  {
    type: "Teach",
    label: "Teach",
    color: "bg-[#dcfce7] hover:bg-[#bbf7d0] border-[#bbf7d0] text-[#166534]",
    legendColor: "bg-[#dcfce7] border-[#bbf7d0]",
    badgeText: "TCH"
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
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(3); // Default Week 4 (June 22)
  const [activeBrush, setActiveBrush] = useState<string>("Nhận ca Test speaking/ chấm writing online");

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
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
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

    return mockRequests
      .filter((r) => {
        const testDate = new Date(r.year, r.month, r.day);
        const inRange = testDate >= mondayDate && testDate <= sundayDate;
        const belongsToAca = (r.examTeacher ?? "").trim() === selectedTeacher.trim();
        return inRange && belongsToAca && r.status === "approved";
      })
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return (a.examTime ?? "").localeCompare(b.examTime ?? "");
      });
  }, [mockRequests, currentWeekIndex, selectedTeacher, getDayDate]);

  return (
    <AcaLayout>
      <AcaTopbar
        title="Lịch Rảnh ACA"
        subtitle="Bảng lịch biểu tuần cấu hình ca rảnh của phòng ACA. Học viên đăng ký theo ca sẽ được tự động xếp lịch thi."
      />
      <main className="mx-auto max-w-7xl px-4 py-4 pb-16 md:px-6 space-y-6">
        
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Filters Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chọn Nhân viên ACA:</span>
            <div className="w-56">
              <NativeSelectChevron
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="h-9 text-xs font-bold shadow-sm"
              >
                {MOCK_TEST_TEACHER_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </NativeSelectChevron>
            </div>
          </div>
          <div className="text-right">
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
          <div className="lg:col-span-8 space-y-4">
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
                                    {isBooked && (
                                      <svg className="w-2.5 h-2.5 text-zinc-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                      </svg>
                                    )}
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
                  * Quy đổi tiêu chuẩn ACA: 1 ca test Speaking = 30p (0.5h) // 1 bài Writing đầy đủ = 60p (1h) // 1 ca dạy/học thử = 60p (1h).
                </p>
              </div>
              <div className="text-center border-l border-zinc-100 pl-6 shrink-0 min-w-[120px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">TOTAL HOURS</span>
                <span className="text-3xl font-black text-[#6a5acd] tabular-nums mt-1 block">{totalWeeklyHours}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Speaking test list */}
          <div className="lg:col-span-4 space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide border-b border-zinc-100 pb-3">
                Speaking Test Schedule
              </h2>
              
              {loading ? (
                <p className="text-xs text-zinc-500 text-center py-6">Đang tải lịch thi...</p>
              ) : weeklyMockTests.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-100 rounded-xl bg-zinc-50/50">
                  <p className="text-xs text-zinc-500">Chưa có ca test Speaking nào được đặt trong tuần này.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {weeklyMockTests.map((req) => {
                    const studentInfo = students.find((s) => s.id === req.studentId);
                    const bcbScore = studentInfo?.scores?.o || "—";
                    const isOnline = !req.examTime?.includes("Offline");
                    
                    return (
                      <div
                        key={req.id}
                        className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm hover:border-[#6a5acd]/30 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border ${
                            isOnline 
                              ? "bg-purple-50 text-purple-700 border-purple-200" 
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {isOnline ? "Online" : "Offline"}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400">
                            Ngày {req.day}/{req.month + 1}
                          </span>
                        </div>

                        <div className="border-t border-zinc-100 pt-2 space-y-1">
                          <div className="text-xs font-bold text-zinc-900 flex justify-between">
                            <span>{req.studentName}</span>
                            <span className="text-[#6a5acd] font-black">{req.examTime?.split(" ")[0]}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] text-zinc-500 font-medium">
                            <div>BCB Đầu vào: <strong className="text-zinc-700">{bcbScore}</strong></div>
                            {studentInfo?.bcbLink ? (
                              <a
                                href={studentInfo.bcbLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#6a5acd] font-bold hover:underline"
                              >
                                Xem BCB ↗
                              </a>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-100 text-[10px]">
                          <div>
                            {req.score ? (
                              <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                                Điểm S: {req.score}
                              </span>
                            ) : (
                              <span className="text-zinc-400">Chưa chấm</span>
                            )}
                          </div>
                          <div>
                            {req.score ? (
                              <span className="font-bold text-emerald-800 uppercase text-[9px]">Đã chấm</span>
                            ) : (
                              <span className="font-bold text-[#6a5acd] uppercase text-[9px]">Chờ test</span>
                            )}
                          </div>
                        </div>
                        
                        {req.examLink ? (
                          <div className="text-[9px] text-zinc-500 truncate pt-1 border-t border-dashed border-zinc-100">
                            Link đề: <a href={req.examLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">{req.examLink}</a>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

        </div>

      </main>
    </AcaLayout>
  );
}
