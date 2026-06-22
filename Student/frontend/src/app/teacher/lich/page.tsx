"use client";

import { useState, useEffect, useMemo } from "react";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";

// Calendar data for May 2026 (May 1st is Friday)
const MAY_CALENDAR = [
  { day: null }, { day: null }, { day: null }, { day: null },
  { day: 1, classes: [{ id: "mom-1", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 2, classes: [{ id: "ups-1", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: null },

  // Week 2
  { day: 3, classes: [] },
  { day: 4, classes: [{ id: "mom-2", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-1", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 5, classes: [{ id: "ups-2", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 6, classes: [{ id: "mom-3", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-2", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 7, classes: [{ id: "ups-3", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 8, classes: [{ id: "mom-4", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-3", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 9, classes: [{ id: "ups-4", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },

  // Week 3
  { day: 10, classes: [] },
  { day: 11, classes: [{ id: "mom-5", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-4", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 12, classes: [{ id: "ups-5", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 13, classes: [{ id: "mom-6", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-5", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 14, classes: [{ id: "ups-6", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 15, classes: [{ id: "mom-7", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-6", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 16, classes: [{ id: "ups-7", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },

  // Week 4
  { day: 17, classes: [] },
  { day: 18, classes: [{ id: "mom-8", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-7", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 19, classes: [{ id: "ups-8", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 20, classes: [{ id: "mom-9", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-8", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 21, classes: [{ id: "ups-9", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 22, classes: [{ id: "mom-10", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-9", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 23, classes: [{ id: "ups-10", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },

  // Week 5
  { day: 24, classes: [] },
  { day: 25, classes: [{ id: "mom-11", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-10", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 26, classes: [{ id: "ups-11", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 27, classes: [{ id: "mom-12", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-11", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 28, classes: [{ id: "ups-12", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 29, classes: [{ id: "mom-13", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-12", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 30, classes: [{ id: "ups-13", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 31, classes: [] }
];

// Calendar data for June 2026 (June 1st is Monday)
const JUNE_CALENDAR = [
  { day: 1, classes: [{ id: "mom-j1", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j1", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 2, classes: [{ id: "ups-j1", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 3, classes: [{ id: "mom-j2", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j2", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 4, classes: [{ id: "ups-j2", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 5, classes: [{ id: "mom-j3", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j3", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 6, classes: [{ id: "ups-j3", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: null },

  // Week 2
  { day: 8, classes: [{ id: "mom-j4", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j4", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 9, classes: [{ id: "ups-j4", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 10, classes: [{ id: "mom-j5", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j5", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 11, classes: [{ id: "ups-j5", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 12, classes: [{ id: "mom-j6", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j6", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 13, classes: [{ id: "ups-j6", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: null },

  // Week 3
  { day: 15, classes: [{ id: "mom-j7", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j7", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 16, classes: [{ id: "ups-j7", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 17, classes: [{ id: "mom-j8", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j8", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 18, classes: [{ id: "ups-j8", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 19, classes: [{ id: "mom-j9", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j9", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 20, classes: [{ id: "ups-j9", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: null },

  // Week 4
  { day: 22, classes: [{ id: "mom-j10", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j10", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 23, classes: [{ id: "ups-j10", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 24, classes: [{ id: "mom-j11", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j11", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 25, classes: [{ id: "ups-j11", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: 26, classes: [{ id: "mom-j12", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j12", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 27, classes: [{ id: "ups-j12", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] },
  { day: null },

  // Week 5
  { day: 29, classes: [{ id: "mom-j13", name: "MOMENTUM", time: "18:00 - 19:45", hours: 1.75 }, { id: "pc-j13", name: "PRE CORE", time: "20:00 - 22:00", hours: 2 }] },
  { day: 30, classes: [{ id: "ups-j13", name: "UPSTREAM", time: "18:00 - 19:45", hours: 1.75 }] }
];

export default function TeacherCalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // 5 = June, 4 = May
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Save attendance
  const toggleAttendance = (sessionId: string) => {
    setAttendance((prev) => {
      const next = { ...prev, [sessionId]: !prev[sessionId] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("xalo.teacher.classAttendance.v1", JSON.stringify(next));
      }
      return next;
    });
  };

  const calendarDays = useMemo(() => {
    return selectedMonth === 4 ? MAY_CALENDAR : JUNE_CALENDAR;
  }, [selectedMonth]);

  // Current date reference: June 19, 2026
  const CURRENT_DATE = useMemo(() => new Date(2026, 5, 19), []);

  const checkIsDisabled = (day: number | null) => {
    if (!day) return true;
    const sessionDate = new Date(2026, selectedMonth, day);
    const diffTime = CURRENT_DATE.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Disabled if: older than 7 days OR is in the future
    return diffDays > 7 || diffDays < 0;
  };

  // Compute actual hours
  const classBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; hoursPerSession: number; total: number }> = {};
    
    calendarDays.forEach((item) => {
      if (item.day && item.classes) {
        item.classes.forEach((cls) => {
          if (!breakdown[cls.name]) {
            breakdown[cls.name] = { count: 0, hoursPerSession: cls.hours, total: 0 };
          }
          breakdown[cls.name].count += 1;
          breakdown[cls.name].total = breakdown[cls.name].count * cls.hours;
        });
      }
    });

    const totalHours = Object.values(breakdown).reduce((acc, cur) => acc + cur.total, 0);
    return { breakdown, totalHours };
  }, [calendarDays]);

  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Lịch giảng dạy"
        subtitle="Quản lý lịch dạy học viên và tick điểm danh buổi dạy (trong vòng 1 tuần)."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8 space-y-6">
        
        {/* Month Selector & Stats Cards */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          
          {/* Left panel with Month Selector & Stats */}
          <div className="w-full md:w-80 space-y-6">
            
            {/* Month Selector */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Chọn tháng xem lịch</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMonth(4)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                    selectedMonth === 4
                      ? "bg-primary text-white shadow-soft"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Tháng 5
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonth(5)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                    selectedMonth === 5
                      ? "bg-primary text-white shadow-soft"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Tháng 6
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-1">
              
              {/* Planned hours card */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Số giờ dạy dự trù</div>
                <div className="mt-2 text-2xl font-black text-foreground">48h <span className="text-xs text-zinc-400 font-bold">/tháng</span></div>
              </div>

              {/* Actual hours card with drilldown */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="bg-white rounded-2xl border border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 p-5 shadow-sm cursor-pointer transition-all group"
              >
                <div className="text-[10px] font-black uppercase text-primary tracking-wider flex justify-between items-center">
                  <span>Số giờ dạy thực tế</span>
                  <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black group-hover:bg-primary group-hover:text-white transition-all">Chi tiết</span>
                </div>
                <div className="mt-2 text-2xl font-black text-primary">
                  {classBreakdown.totalHours.toFixed(2)}h
                </div>
              </div>

            </div>
          </div>

          {/* Main Area: Calendar */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Lịch dạy Tháng {selectedMonth + 1} / 2026
                </h3>
                <span className="text-[10px] font-bold text-zinc-400">Hệ thống điểm danh giáo viên</span>
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
                  const isDisabled = checkIsDisabled(item.day);
                  
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
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" title="Đang trong hạn điểm danh" />
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1.5 mt-1.5 flex-1 justify-end">
                            {item.classes && item.classes.map((cls, cIdx) => {
                              const isChecked = Boolean(attendance[cls.id]);
                              
                              return (
                                <div
                                  key={cIdx}
                                  className={`text-[8px] leading-tight p-1.5 rounded font-black border flex flex-col gap-1 transition-all ${
                                    isChecked
                                      ? "bg-emerald-50/70 text-emerald-800 border-emerald-200"
                                      : "bg-zinc-50 text-zinc-700 border-zinc-200/80"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="truncate max-w-[80%]">{cls.name}</span>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isDisabled}
                                      onChange={() => toggleAttendance(cls.id)}
                                      className="h-3 w-3 rounded border-zinc-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                      title={
                                        isDisabled
                                          ? "Đã quá hạn 7 ngày hoặc chưa tới ngày có lớp"
                                          : "Click để tích điểm danh ca dạy"
                                      }
                                    />
                                  </div>
                                  <span className="text-[7px] text-zinc-400 font-semibold">{cls.time} ({cls.hours}h)</span>
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
                <p className="text-xs text-zinc-500 mt-1">Danh sách lớp dạy và tổng hợp giờ dạy trong Tháng {selectedMonth + 1}.</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Lớp học</th>
                      <th className="px-4 py-3 text-center">Số buổi dạy</th>
                      <th className="px-4 py-3 text-center">Số giờ / buổi</th>
                      <th className="px-4 py-3 text-right">Tổng thực tế</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {Object.entries(classBreakdown.breakdown).map(([name, val]) => (
                      <tr key={name} className="hover:bg-zinc-50/50">
                        <td className="px-4 py-3 font-bold text-zinc-900">{name}</td>
                        <td className="px-4 py-3 text-center tabular-nums">{val.count} buổi</td>
                        <td className="px-4 py-3 text-center tabular-nums">{val.hoursPerSession}h</td>
                        <td className="px-4 py-3 text-right tabular-nums text-primary font-black">{val.total.toFixed(2)}h</td>
                      </tr>
                    ))}
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
                  className="rounded-xl bg-zinc-100 text-zinc-700 px-5 py-2 text-xs font-bold hover:bg-zinc-200 transition-colors"
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
