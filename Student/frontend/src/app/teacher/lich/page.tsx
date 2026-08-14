"use client";

import { useState, useEffect, useMemo } from "react";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { fetchAcaClasses, type AcaClass } from "@/lib/acaManagementApi";
import { ACA_CLASSES } from "@/lib/acaMockData";
import { getCachedAuthUser } from "@/lib/auth";

// Parse date string (supports DD/MM/YYYY and YYYY-MM-DD)
function parseAnyDate(dStr?: string): Date | null {
  if (!dStr || dStr === "-" || dStr === "Chưa xếp") return null;
  if (dStr.includes("/")) {
    const parts = dStr.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }
  if (dStr.includes("-")) {
    const parts = dStr.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }
  return null;
}

// Parse class schedule: 246 (Mon, Wed, Fri), 357 (Tue, Thu, Sat), S/S (Sat, Sun), time shift, duration, clean name
function parseClassSchedule(name: string, classCode?: string) {
  const text = `${name || ""} ${classCode || ""}`.toLowerCase();

  let days: number[] = []; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  let daysLabel = "";

  if (text.includes("246") || text.includes("mwf") || text.includes("m/w/f") || text.includes("t2,4,6") || text.includes("t246")) {
    days = [1, 3, 5]; // Mon, Wed, Fri
    daysLabel = "T2-T4-T6";
  } else if (text.includes("357") || text.includes("tts") || text.includes("t/t/s") || text.includes("t3,5,7") || text.includes("t357")) {
    days = [2, 4, 6]; // Tue, Thu, Sat
    daysLabel = "T3-T5-T7";
  } else if (text.includes("s/s") || text.includes("t7cn") || text.includes("t7 cn") || text.includes("t7-cn")) {
    days = [6, 0]; // Sat, Sun
    daysLabel = "T7-CN";
  } else {
    days = [1, 3, 5]; // Default Mon, Wed, Fri
    daysLabel = "T2-T4-T6";
  }

  let timeRange = "18:00 - 19:45";
  let duration = 1.75;

  if (text.includes("c2") || text.includes("ca 2")) {
    timeRange = "19:45 - 21:30";
    duration = 1.75;
  } else if (text.includes("c1") || text.includes("ca 1")) {
    timeRange = "18:00 - 19:45";
    duration = 1.75;
  } else if (text.includes("18002000") || text.includes("18:00 - 20:00")) {
    timeRange = "18:00 - 20:00";
    duration = 2.0;
  } else if (text.includes("20002200") || text.includes("20:00 - 22:00")) {
    timeRange = "20:00 - 22:00";
    duration = 2.0;
  }

  let cleanName = "LỚP HỌC";
  if (text.includes("momentum")) cleanName = "MOMENTUM";
  else if (text.includes("upstream")) cleanName = "UPSTREAM";
  else if (text.includes("soar")) cleanName = "SOAR";
  else if (text.includes("advanced")) cleanName = "ADVANCED";
  else if (text.includes("foundation")) cleanName = "FOUNDATION";
  else if (text.includes("pre core") || text.includes("pcore")) cleanName = "PRE CORE";
  else if (classCode) cleanName = classCode;
  else if (name) cleanName = name.split(" - ")[0].replace("XLE RLP_", "").trim();

  return { days, daysLabel, timeRange, duration, cleanName };
}

function getPhaseDurationDays(name: string, code?: string, customDuration?: number): number {
  if (customDuration && customDuration > 0) return customDuration;
  const upper = `${name || ""} ${code || ""}`.toUpperCase();
  if (upper.includes("FOU") || upper.includes("FOUND")) return 105;
  if (upper.includes("PRE CORE") || upper.includes("PCORE") || upper.includes("PRECORE") || upper.includes("PRE IELTS") || upper.includes("CORE")) return 60;
  return 42; // default phase 6 weeks = 42 days
}

// Parse teacher name from class name (e.g. "XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa") or teacher field
function getTeacherOfClass(cls: AcaClass): string {
  const name = cls.name || "";
  if (name.includes("GV ")) {
    const parts = name.split("GV ");
    if (parts[1]) {
      const gvName = parts[1].trim();
      if (gvName) return gvName;
    }
  }
  if (name.includes("GV.")) {
    const parts = name.split("GV.");
    if (parts[1]) {
      const gvName = parts[1].trim();
      if (gvName) return gvName;
    }
  }
  if (cls.teacher && cls.teacher.trim()) {
    return cls.teacher.trim();
  }
  return "Chưa gán GV";
}

export default function TeacherCalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(4); // 4 = May, 5 = June, 6 = July
  const [selectedYear] = useState<number>(2026);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allClasses, setAllClasses] = useState<AcaClass[]>([]);

  // Resolve active logged in teacher name
  const loggedInTeacherName = useMemo(() => {
    const user = getCachedAuthUser();
    if (user && user.name && user.name !== "Teacher") {
      return user.name;
    }
    return "Nghiêm Doãn Quỳnh Châu"; // Default teacher profile for Portal
  }, []);

  // Load classes from API or mock fallback
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAcaClasses();
        if (data && data.length > 0) {
          setAllClasses(data);
        } else {
          setAllClasses(ACA_CLASSES as any);
        }
      } catch {
        setAllClasses(ACA_CLASSES as any);
      }
    }
    void load();
  }, []);

  // Initialize and auto-select active teacher account
  useEffect(() => {
    if (allClasses.length > 0) {
      const userLower = loggedInTeacherName.toLowerCase();
      const match = allClasses.find((c) => {
        const t = getTeacherOfClass(c).toLowerCase();
        return t.includes(userLower) || userLower.includes(t) || (c.teacher || "").toLowerCase().includes(userLower);
      });
      if (match) {
        setSelectedTeacher(getTeacherOfClass(match));
      } else {
        setSelectedTeacher(loggedInTeacherName);
      }
    } else if (!selectedTeacher) {
      setSelectedTeacher(loggedInTeacherName);
    }
  }, [allClasses, loggedInTeacherName]);

  // Load saved attendance from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("xalo.teacher.classAttendance.v1");
      if (saved) {
        try {
          setAttendance(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Toggle attendance state
  const toggleAttendance = (sessionId: string) => {
    setAttendance((prev) => {
      const next = { ...prev, [sessionId]: !prev[sessionId] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("xalo.teacher.classAttendance.v1", JSON.stringify(next));
      }
      return next;
    });
  };

  // List of all unique teachers extracted from class names
  const teacherOptions = useMemo(() => {
    const set = new Set<string>();
    allClasses.forEach((c) => {
      const t = getTeacherOfClass(c);
      if (t && t !== "Chưa gán GV") set.add(t);
      if (c.teacher && c.teacher.trim()) set.add(c.teacher.trim());
    });
    return ["Tất cả giáo viên", ...Array.from(set)];
  }, [allClasses]);

  // Filter classes strictly belonging to the active logged-in teacher only
  const filteredClasses = useMemo(() => {
    const teacherName = selectedTeacher || loggedInTeacherName;
    if (!teacherName) return allClasses;
    const target = teacherName.toLowerCase();
    return allClasses.filter((c) => {
      const extractedTeacher = getTeacherOfClass(c).toLowerCase();
      const rawTeacher = (c.teacher || "").toLowerCase();
      const className = (c.name || "").toLowerCase();
      return (
        extractedTeacher.includes(target) ||
        target.includes(extractedTeacher) ||
        rawTeacher.includes(target) ||
        className.includes(target)
      );
    });
  }, [allClasses, selectedTeacher, loggedInTeacherName]);

  // Dynamically build calendar grid for selected month based on class schedules & start dates
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...

    const grid: Array<{ day: number | null; classes?: Array<{ id: string; name: string; time: string; hours: number }> }> = [];

    // Padding empty cells before the 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push({ day: null });
    }

    // Build days 1 to daysInMonth
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(selectedYear, selectedMonth, d);
      const dayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon ...

      const dayClasses: Array<{ id: string; name: string; time: string; hours: number }> = [];

      filteredClasses.forEach((cls) => {
        const sched = parseClassSchedule(cls.name, cls.classCode);

        // Check if class meets on this day of week (246 vs 357 vs S/S)
        if (!sched.days.includes(dayOfWeek)) return;

        // Check phase start & end dates
        const startDate = parseAnyDate(cls.phaseStartDate) || parseAnyDate(cls.openDate);
        if (startDate) {
          const durationDays = getPhaseDurationDays(cls.name, cls.classCode, cls.phaseDurationDays);
          const endDate = new Date(startDate.getTime() + durationDays * 86400000);

          const startZero = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const endZero = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          const currZero = new Date(selectedYear, selectedMonth, d);

          if (currZero < startZero || currZero > endZero) {
            // Check if class month matches selectedMonth + 1 as fallback
            if (cls.month && cls.month !== selectedMonth + 1) return;
          }
        } else if (cls.month && cls.month !== selectedMonth + 1) {
          return;
        }

        // Add class session to this date
        const sessionId = `${cls.id || cls.classCode || "cls"}-${selectedYear}-${selectedMonth + 1}-${d}`;
        dayClasses.push({
          id: sessionId,
          name: `${sched.cleanName}${cls.classCode ? ` (${cls.classCode})` : ""}`,
          time: sched.timeRange,
          hours: sched.duration,
        });
      });

      grid.push({
        day: d,
        classes: dayClasses,
      });
    }

    return grid;
  }, [selectedYear, selectedMonth, filteredClasses]);

  // Current date reference for attendance 7-day rule
  const CURRENT_DATE = useMemo(() => new Date(2026, 5, 19), []);

  const checkSessionState = (day: number | null) => {
    if (!day) return { isDisabled: true, isAutoAbsent: false, isFuture: true };
    const sessionDate = new Date(selectedYear, selectedMonth, day);
    const diffTime = CURRENT_DATE.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { isDisabled: true, isAutoAbsent: false, isFuture: true };
    }
    if (diffDays > 7) {
      return { isDisabled: true, isAutoAbsent: true, isFuture: false };
    }
    return { isDisabled: false, isAutoAbsent: false, isFuture: false };
  };

  // Compute planned vs actual hours & class breakdown
  const classBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; hoursPerSession: number; total: number }> = {};
    let totalPlannedHours = 0;
    let totalActualHours = 0;

    calendarDays.forEach((item) => {
      if (item.day && item.classes) {
        item.classes.forEach((cls) => {
          if (!breakdown[cls.name]) {
            breakdown[cls.name] = { count: 0, hoursPerSession: cls.hours, total: 0 };
          }
          breakdown[cls.name].count += 1;
          breakdown[cls.name].total = breakdown[cls.name].count * cls.hours;
          totalPlannedHours += cls.hours;

          if (attendance[cls.id]) {
            totalActualHours += cls.hours;
          }
        });
      }
    });

    return {
      breakdown,
      plannedHours: totalPlannedHours,
      totalHours: totalActualHours,
    };
  }, [calendarDays, attendance]);

  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Lịch giảng dạy giáo viên"
        subtitle="Giáo viên tự vào tích điểm danh có mặt. Nếu sau 7 ngày chưa tích, hệ thống sẽ tự động chuyển thành Vắng mặt và khóa chỉnh sửa."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8 space-y-6">
        
        {/* Controls & Stats Cards */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          
          {/* Left panel: Filters & Stats */}
          <div className="w-full md:w-80 space-y-6">
            
            {/* Filter Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Giáo viên giảng dạy
                </label>
                <div className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 flex items-center gap-2 text-xs font-black text-foreground shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{selectedTeacher || loggedInTeacherName}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Chọn tháng xem lịch
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMonth((m) => Math.max(0, m - 1))}
                    className="h-10 w-10 rounded-xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-all font-bold"
                  >
                    ←
                  </button>
                  <div className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white px-3 flex items-center justify-center text-xs font-black text-foreground">
                    Tháng {selectedMonth + 1} / {selectedYear}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMonth((m) => Math.min(11, m + 1))}
                    className="h-10 w-10 rounded-xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-all font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            {/* Teaching Hours Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-950">
                    Tổng giờ dạy thực tế
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    Tháng {selectedMonth + 1} / {selectedYear}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px] font-black uppercase text-primary hover:bg-primary/10 transition-all"
                >
                  Chi tiết
                </button>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-500">Giờ dự trù:</span>
                  <span className="text-foreground font-black tabular-nums">{classBreakdown.plannedHours.toFixed(2)}h</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-500">Đã điểm danh (Có mặt):</span>
                  <span className="text-emerald-700 font-black tabular-nums">{classBreakdown.totalHours.toFixed(2)}h</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${
                        classBreakdown.plannedHours > 0
                          ? Math.min(100, (classBreakdown.totalHours / classBreakdown.plannedHours) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Main Area: Calendar */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Lịch dạy Tháng {selectedMonth + 1} / {selectedYear} ({selectedTeacher})
                </h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Tự động đánh Vắng mặt sau 7 ngày
                </span>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 border-t border-zinc-100 pt-4">
                {/* Days Headers */}
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((h) => (
                  <div key={h} className="text-center text-[10px] font-black uppercase text-zinc-400 py-2">
                    {h}
                  </div>
                ))}

                {/* Days Blocks */}
                {calendarDays.map((item, idx) => {
                  const { isDisabled } = checkSessionState(item.day);
                  
                  return (
                    <div
                      key={idx}
                      className={`min-h-[105px] border border-zinc-100 rounded-xl p-1.5 flex flex-col justify-between transition-all ${
                        item.day ? "bg-white hover:border-primary/25 hover:shadow-sm" : "bg-zinc-50/50 border-none"
                      }`}
                    >
                      {item.day ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-zinc-400">{item.day}</span>
                            {!isDisabled && (
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" title="Đang trong hạn điểm danh (7 ngày)" />
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1.5 mt-1.5 flex-1 justify-end">
                            {item.classes && item.classes.map((cls, cIdx) => {
                              const isChecked = Boolean(attendance[cls.id]);
                              const { isDisabled: sessionDisabled, isAutoAbsent, isFuture } = checkSessionState(item.day);
                              const isAbsent = isAutoAbsent && !isChecked;

                              let badgeStyle = "bg-zinc-50 text-zinc-700 border-zinc-200/80";
                              let statusText = "Chưa điểm danh";
                              if (isChecked) {
                                badgeStyle = "bg-emerald-50/90 text-emerald-800 border-emerald-300";
                                statusText = "Có mặt";
                              } else if (isAbsent) {
                                badgeStyle = "bg-red-50/90 text-red-800 border-red-300";
                                statusText = "Vắng mặt";
                              } else if (isFuture) {
                                statusText = "Chưa đến ngày";
                              }

                              return (
                                <div
                                  key={cIdx}
                                  className={`text-[8px] leading-tight p-1.5 rounded font-black border flex flex-col gap-1 transition-all ${badgeStyle}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="truncate max-w-[75%]" title={cls.name}>{cls.name}</span>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={sessionDisabled}
                                      onChange={() => toggleAttendance(cls.id)}
                                      className="h-3 w-3 rounded border-zinc-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                      title={
                                        isAbsent
                                          ? "Đã quá 7 ngày chưa điểm danh -> Hệ thống tự động ghi nhận Vắng mặt và khóa sửa"
                                          : isFuture
                                          ? "Chưa đến ngày có lớp"
                                          : isChecked && sessionDisabled
                                          ? "Đã điểm danh Có mặt (Đã khóa sau 7 ngày)"
                                          : "Click để tích điểm danh Có mặt"
                                      }
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[7px] text-zinc-400 font-semibold">
                                    <span>{cls.time} ({cls.hours}h)</span>
                                    <span className={isChecked ? "text-emerald-700 font-bold" : isAbsent ? "text-red-700 font-bold" : "text-zinc-400"}>
                                      {statusText}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Hour breakdown drilldown modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-premium space-y-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950">Chi tiết giờ dạy thực tế</h3>
                <p className="text-xs text-zinc-500 mt-1">Danh sách lớp dạy và tổng hợp giờ dạy trong Tháng {selectedMonth + 1} / {selectedYear}.</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-200 max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase text-zinc-400 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Lớp học</th>
                      <th className="px-4 py-3 text-center">Số buổi dạy</th>
                      <th className="px-4 py-3 text-center">Số giờ / buổi</th>
                      <th className="px-4 py-3 text-right">Tổng giờ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {Object.keys(classBreakdown.breakdown).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-zinc-400 italic">Không có lớp học nào trong tháng này.</td>
                      </tr>
                    ) : (
                      Object.entries(classBreakdown.breakdown).map(([name, val]) => (
                        <tr key={name} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-3 font-bold text-zinc-900">{name}</td>
                          <td className="px-4 py-3 text-center tabular-nums">{val.count} buổi</td>
                          <td className="px-4 py-3 text-center tabular-nums">{val.hoursPerSession}h</td>
                          <td className="px-4 py-3 text-right tabular-nums text-primary font-black">{val.total.toFixed(2)}h</td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-zinc-50 font-black text-zinc-950 border-t border-zinc-200">
                      <td className="px-4 py-3" colSpan={3}>Tổng cộng</td>
                      <td className="px-4 py-3 text-right text-primary text-sm">{classBreakdown.totalHours.toFixed(2)}h</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-zinc-100 text-zinc-700 px-5 py-2 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </TeacherLayout>
  );
}
