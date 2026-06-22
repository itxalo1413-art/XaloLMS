"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { NativeSelectChevron } from "@/components/student/ui";
import {
  fetchAcaClasses,
  fetchAcaStudents,
  fetchAca11Classes,
  canUseAcaApi,
  type AcaClass,
  type AcaStudent,
  type Aca11Class,
} from "@/lib/acaManagementApi";

const countDaysInMonth = (year: number, monthIndex: number, daysOfWeek: number[]) => {
  let count = 0;
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  for (let d = 1; d <= totalDays; d++) {
    const dayOfWeek = new Date(year, monthIndex, d).getDay();
    if (daysOfWeek.includes(dayOfWeek)) {
      count++;
    }
  }
  return count;
};

const parseDuration = (timeRange: string) => {
  const parts = timeRange.split("-");
  if (parts.length < 2) return 1.75;
  const start = parts[0].trim();
  const end = parts[1].trim();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (!isNaN(sh) && !isNaN(eh)) {
    const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
    return diff / 60;
  }
  return 1.75;
};

interface ClassSchedule {
  days: number[];
  daysLabel: string;
  timeRange: string;
  duration: number;
  cleanName: string;
}

const parseClassSchedule = (name: string): ClassSchedule => {
  const nameLower = name.toLowerCase();
  
  // 1. Parse days
  let days: number[] = [];
  let daysLabel = "";
  if (nameLower.includes("246")) {
    days = [1, 3, 5];
    daysLabel = "T2-T4-T6";
  } else if (nameLower.includes("357")) {
    days = [2, 4, 6];
    daysLabel = "T3-T5-T7";
  } else if (nameLower.includes("s/s")) {
    days = [6, 0];
    daysLabel = "T7-CN";
  }
  
  // 2. Parse time range and duration
  let timeRange = "18:00 - 19:45";
  let duration = 1.75;
  
  if (nameLower.includes("c2")) {
    timeRange = "19:45 - 21:30";
    duration = 1.75;
  } else if (nameLower.includes("c1")) {
    timeRange = "18:00 - 19:45";
    duration = 1.75;
  } else if (nameLower.includes("18002000")) {
    timeRange = "18:00 - 20:00";
    duration = 2.0;
  } else if (nameLower.includes("20002200")) {
    timeRange = "20:00 - 22:00";
    duration = 2.0;
  }
  
  // 3. Extract clean class type/name
  let cleanName = "LỚP";
  if (nameLower.includes("momentum")) cleanName = "MOMENTUM";
  else if (nameLower.includes("upstream")) cleanName = "UPSTREAM";
  else if (nameLower.includes("soar")) cleanName = "SOAR";
  else if (nameLower.includes("advanced")) cleanName = "ADVANCED";
  else if (nameLower.includes("foundation")) cleanName = "FOUNDATION";
  else if (nameLower.includes("pre core")) cleanName = "PRE CORE";
  else {
    const parts = name.split(" - ");
    if (parts[0]) {
      cleanName = parts[0].replace("XLE RLP_", "").trim().toUpperCase();
    }
  }
  
  return { days, daysLabel, timeRange, duration, cleanName };
};

export default function LopTheoThangPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<"calendar" | "list">("calendar");
  const [selectedClass, setSelectedClass] = useState<AcaClass | Aca11Class | null>(null);
  
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [classes11, setClasses11] = useState<Aca11Class[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        if (!canUseAcaApi()) {
          setLoadError("Chưa có phiên đăng nhập ACA hoặc API chưa sẵn sàng.");
          setClasses([]);
          setClasses11([]);
          setStudents([]);
          return;
        }
        const [clsData, cls11Data, stData] = await Promise.all([
          fetchAcaClasses(),
          fetchAca11Classes(),
          fetchAcaStudents(),
        ]);
        setClasses(clsData);
        setClasses11(cls11Data);
        setStudents(stData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không tải được dữ liệu lớp.";
        setLoadError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => c.month === selectedMonth);
  }, [classes, selectedMonth]);

  const handleCalendarClassClick = (clsStr: string) => {
    const parts = clsStr.split(" | ");
    const cleanName = parts[0].trim().toLowerCase();
    
    // Check if it's a 1:1 class
    const found11 = classes11.find(
      (c) => c.className.toLowerCase() === cleanName || c.className.toLowerCase().includes(cleanName)
    );
    if (found11) {
      setSelectedClass(found11);
      return;
    }

    // Check regular classes
    const found = classes.find((c) => {
      if (c.month !== selectedMonth) return false;
      const nameLower = c.name.toLowerCase();
      if (cleanName.includes("momentum")) return nameLower.includes("momentum");
      if (cleanName.includes("upstream")) return nameLower.includes("upstream");
      if (cleanName.includes("soar")) return nameLower.includes("soar");
      return nameLower.includes(cleanName);
    });

    if (found) {
      setSelectedClass(found);
    } else {
      const fallback = classes.find((c) => {
        const nameLower = c.name.toLowerCase();
        if (cleanName.includes("momentum")) return nameLower.includes("momentum");
        if (cleanName.includes("upstream")) return nameLower.includes("upstream");
        if (cleanName.includes("soar")) return nameLower.includes("soar");
        return nameLower.includes(cleanName);
      });
      if (fallback) setSelectedClass(fallback);
    }
  };

  // Dynamic calendar calculator
  const calendarDays = useMemo(() => {
    const year = 2026;
    const monthIndex = selectedMonth - 1; // 5 -> index 4, 6 -> index 5
    
    const firstDay = new Date(year, monthIndex, 1);
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    
    // Sunday is 0, Monday is 1, ..., Saturday is 6
    const startDayOfWeek = firstDay.getDay(); 
    
    const days: { day: number | null; classes: string[] }[] = [];
    
    // Empty blocks before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, classes: [] });
    }
    
    // Populating month dates
    for (let d = 1; d <= totalDays; d++) {
      const currentDate = new Date(year, monthIndex, d);
      const dayOfWeek = currentDate.getDay();
      const dayClasses: string[] = [];
      
      // 1. Map regular classes based on schedule codes
      filteredClasses.forEach((c) => {
        const { days: schedDays, timeRange, cleanName } = parseClassSchedule(c.name);
        if (schedDays.includes(dayOfWeek)) {
          dayClasses.push(`${cleanName} | ${timeRange}`);
        }
      });
      
      // 2. Map active 1:1 classes based on their schedule string
      classes11.forEach((c11) => {
        if (c11.status !== "Đang diễn ra") return;
        
        const sched = c11.schedule || "";
        const parts = sched.split(" ");
        const dayPart = parts[0]?.toUpperCase() || "";
        const timeRange = parts.slice(1).join(" ") || "15:00 - 17:00";
        
        let isScheduled = false;
        if (dayPart.includes("T2")) isScheduled = dayOfWeek === 1;
        else if (dayPart.includes("T3")) isScheduled = dayOfWeek === 2;
        else if (dayPart.includes("T4")) isScheduled = dayOfWeek === 3;
        else if (dayPart.includes("T5")) isScheduled = dayOfWeek === 4;
        else if (dayPart.includes("T6")) isScheduled = dayOfWeek === 5;
        else if (dayPart.includes("T7")) isScheduled = dayOfWeek === 6;
        else if (dayPart.includes("CN")) isScheduled = dayOfWeek === 0;
        
        if (isScheduled) {
          dayClasses.push(`${c11.className} | ${timeRange}`);
        }
      });
      
      days.push({ day: d, classes: dayClasses });
    }
    
    return days;
  }, [selectedMonth, filteredClasses, classes11]);

  // Expected classes summaries dynamically computed
  const expectedSessions = useMemo(() => {
    const year = 2026;
    const monthIndex = selectedMonth - 1;
    const sessions: { name: string; details: string; total: string }[] = [];
    
    // Regular classes computation
    filteredClasses.forEach((c) => {
      const { days: schedDays, daysLabel, duration, cleanName } = parseClassSchedule(c.name);
      
      if (schedDays.length > 0) {
        const count = countDaysInMonth(year, monthIndex, schedDays);
        const totalHours = count * duration;
        
        const nameLower = c.name.toLowerCase();
        let slotLabel = "ca 1";
        if (nameLower.includes("c2")) slotLabel = "ca 2";
        else if (nameLower.includes("18002000")) slotLabel = "18h-20h";
        else if (nameLower.includes("20002200")) slotLabel = "20h-22h";
        else if (nameLower.includes("c1")) slotLabel = "ca 1";
        
        sessions.push({
          name: `${cleanName} ${slotLabel} (${c.teacher})`,
          details: `${count} buổi x ${duration.toFixed(2)}h (${daysLabel})`,
          total: `${totalHours.toFixed(1)}h`,
        });
      }
    });
    
    // 1:1 classes computation
    classes11.forEach((c11) => {
      if (c11.status !== "Đang diễn ra") return;
      
      const sched = c11.schedule || "";
      const parts = sched.split(" ");
      const dayPart = parts[0]?.toUpperCase() || "";
      const timeRange = parts.slice(1).join(" ") || "15:00 - 17:00";
      
      let daysOfWeek: number[] = [];
      let daysLabel = "";
      if (dayPart.includes("T2")) { daysOfWeek = [1]; daysLabel = "Thứ 2"; }
      else if (dayPart.includes("T3")) { daysOfWeek = [2]; daysLabel = "Thứ 3"; }
      else if (dayPart.includes("T4")) { daysOfWeek = [3]; daysLabel = "Thứ 4"; }
      else if (dayPart.includes("T5")) { daysOfWeek = [4]; daysLabel = "Thứ 5"; }
      else if (dayPart.includes("T6")) { daysOfWeek = [5]; daysLabel = "Thứ 6"; }
      else if (dayPart.includes("T7")) { daysOfWeek = [6]; daysLabel = "Thứ 7"; }
      else if (dayPart.includes("CN")) { daysOfWeek = [0]; daysLabel = "Chủ Nhật"; }
      
      if (daysOfWeek.length > 0) {
        const count = countDaysInMonth(year, monthIndex, daysOfWeek);
        const duration = parseDuration(timeRange);
        const totalHours = count * duration;
        
        sessions.push({
          name: `1:1 ${c11.className}`,
          details: `${count} buổi x ${duration.toFixed(2)}h (${daysLabel})`,
          total: `${totalHours.toFixed(1)}h`,
        });
      }
    });
    
    return sessions;
  }, [selectedMonth, filteredClasses, classes11]);

  const classStudents = useMemo(() => {
    if (selectedClass && !("className" in selectedClass)) {
      return students.filter((st) => st.classId === selectedClass.id);
    }
    return [];
  }, [selectedClass, students]);

  return (
    <AcaLayout>
      <AcaTopbar
        title="Danh sách & Lịch các lớp theo tháng"
        subtitle="Quản lý thời khóa biểu chi tiết, thống kê số giờ dạy dự kiến và quản lý lớp học."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8 space-y-6">
        {loadError ? (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs font-semibold text-warning">
            {loadError}
          </div>
        ) : null}
        
        {/* Month Selector and Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black uppercase text-muted tracking-wider">Chọn tháng:</label>
            <div className="w-48">
              <NativeSelectChevron
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-10 text-xs font-bold text-zinc-700 shadow-sm"
              >
                <option value={5}>Tháng 5 / 2026</option>
                <option value={6}>Tháng 6 / 2026</option>
              </NativeSelectChevron>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                activeTab === "calendar"
                  ? "bg-white text-primary shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Lịch học chi tiết
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                activeTab === "list"
                  ? "bg-white text-primary shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Danh sách lớp học
            </button>
          </div>
        </div>

        {/* Dynamic content rendering grid workspace */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Đang tải dữ liệu lịch học...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left/Sidebar: Expected calculations */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground pb-2 border-b border-zinc-100">
                  Dự kiến lớp học (Tháng {selectedMonth})
                </h3>
                {expectedSessions.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center italic">Không có lớp học dự kiến hoạt động.</p>
                ) : (
                  <div className="space-y-3">
                    {expectedSessions.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-zinc-800">{item.name}</div>
                          <div className="text-[10px] text-zinc-400 font-medium">{item.details}</div>
                        </div>
                        <span className="font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                          {item.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right/Main Area: Calendar or Table */}
            <div className="md:col-span-2">
              {activeTab === "calendar" ? (
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Thời khóa biểu Tháng {selectedMonth} / 2026
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-400">Dự kiến {selectedMonth === 5 ? 31 : 30} ngày</span>
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
                    {calendarDays.map((item, idx) => (
                      <div
                        key={idx}
                        className={`min-h-[90px] border border-zinc-100 rounded-xl p-1.5 flex flex-col justify-between transition-all ${
                          item.day ? "bg-white hover:border-primary/20 hover:shadow-sm" : "bg-zinc-50/50 border-none"
                        }`}
                      >
                        {item.day ? (
                          <>
                            <span className="text-[10px] font-black text-zinc-400">{item.day}</span>
                            <div className="flex flex-col gap-1 mt-1 flex-1 justify-end">
                              {item.classes && item.classes.map((cls, cIdx) => {
                                const is11 = cls.includes("1:1");
                                const isMomentum = cls.toLowerCase().includes("momentum");
                                const isUpstream = cls.toLowerCase().includes("upstream");
                                return (
                                  <div
                                    key={cIdx}
                                    onClick={() => handleCalendarClassClick(cls)}
                                    className={`text-[8.5px] leading-tight p-1 rounded font-black truncate max-w-full cursor-pointer hover:opacity-85 transition-opacity ${
                                      is11
                                        ? "bg-amber-100 text-amber-700"
                                        : isMomentum
                                        ? "bg-red-100 text-red-700"
                                        : isUpstream
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                                    }`}
                                    title={`Click xem chi tiết: ${cls}`}
                                  >
                                    {cls.split(" | ")[0]}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Table list */
                <ClassTableList classes={filteredClasses} onSelectClass={setSelectedClass} />
              )}
            </div>
          </div>
        )}

      </main>

      {/* CLASS DETAILS MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 max-w-3xl w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-100">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/10 text-primary mb-1">
                  {"className" in selectedClass ? "Lớp kèm 1:1" : selectedClass.type}
                </span>
                <h3 className="text-base font-black text-foreground">
                  {"className" in selectedClass ? selectedClass.className : selectedClass.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-zinc-400 hover:text-zinc-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs">
              
              {/* Detailed parameters grid */}
              {"className" in selectedClass ? (
                <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">THÔNG TIN LỚP 1:1</h4>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Giáo viên:</span>
                      <span className="font-black text-zinc-800">{selectedClass.teacher}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Lịch học:</span>
                      <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded">{selectedClass.schedule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Ngày bắt đầu:</span>
                      <span className="font-black text-zinc-800">{selectedClass.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Ngày kết thúc:</span>
                      <span className="font-black text-zinc-800">{selectedClass.endDate}</span>
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-zinc-200/80 pl-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">TIẾN ĐỘ & KẾT QUẢ</h4>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Trạng thái:</span>
                      <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">{selectedClass.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Tiến độ buổi:</span>
                      <span className="font-black text-zinc-800">{selectedClass.progress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold">Đầu ra dự kiến:</span>
                      <span className="font-black text-zinc-800">{selectedClass.output}</span>
                    </div>
                    {selectedClass.zoomLink ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Link Zoom:</span>
                        <a href={selectedClass.zoomLink} target="_blank" rel="noreferrer" className="font-black text-primary underline">Vào phòng</a>
                      </div>
                    ) : null}
                  </div>
                  {selectedClass.otherNote ? (
                    <div className="col-span-2 pt-2 border-t border-zinc-200/50">
                      <span className="text-zinc-500 font-bold block mb-1">Ghi chú khác:</span>
                      <p className="font-semibold text-zinc-700 bg-white p-2.5 rounded-xl border border-zinc-200">{selectedClass.otherNote}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">THÔNG TIN LỚP HIỆN TẠI</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Giáo viên phụ trách:</span>
                        <span className="font-black text-zinc-800">{selectedClass.teacher}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Ngày mở lớp:</span>
                        <span className="font-black text-zinc-800">{selectedClass.openDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Chặng hiện tại:</span>
                        <span className="font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">{selectedClass.currentPhase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Khai giảng chặng:</span>
                        <span className="font-black text-zinc-800">{selectedClass.phaseStartDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Sĩ số chặng hiện tại:</span>
                        <span className="font-black text-zinc-800">{selectedClass.phaseStudents} học viên</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-l border-zinc-200/80 pl-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">THÔNG TIN TUYỂN SINH CHẶNG KẾ</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Chặng tiếp theo:</span>
                        <span className="font-black text-secondary uppercase bg-secondary/5 px-2 py-0.5 rounded">{selectedClass.nextPhase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Khai giảng chặng kế:</span>
                        <span className="font-black text-zinc-800">{selectedClass.nextPhaseStartDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold">Sỉ số cần tuyển:</span>
                        <span className="font-black text-warning bg-warning/5 px-2 py-0.5 rounded">{selectedClass.slotsToEnroll} học viên</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Class roster section (only for regular classes) */}
              {selectedClass && !("className" in selectedClass) && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">DANH SÁCH HỌC VIÊN ({classStudents.length} HỌC VIÊN)</h4>
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-[9px] font-black uppercase tracking-wider text-muted whitespace-nowrap">
                          <th className="px-4 py-2.5 text-center">STT</th>
                          <th className="px-4 py-2.5">Họ và tên</th>
                          <th className="px-4 py-2.5">SĐT</th>
                          <th className="px-4 py-2.5">Gmail</th>
                          <th className="px-4 py-2.5">Phân loại học viên</th>
                          <th className="px-4 py-2.5 text-center">L/R/W/S/O</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                        {classStudents.length > 0 ? (
                          classStudents.map((st, sIdx) => (
                            <tr key={st.id} className="hover:bg-zinc-50/50 align-middle">
                              <td className="px-4 py-2 text-center text-zinc-400 font-bold tabular-nums">{sIdx + 1}</td>
                              <td className="px-4 py-2 font-black text-foreground">{st.name}</td>
                              <td className="px-4 py-2 text-zinc-500 tabular-nums">{st.phone}</td>
                              <td className="px-4 py-2 text-zinc-500 font-medium">{st.email}</td>
                              <td className="px-4 py-2 text-zinc-600 font-medium">{st.classification || "-"}</td>
                              <td className="px-4 py-2 text-center font-bold tabular-nums text-zinc-800">
                                {st.scores.l}/{st.scores.r}/{st.scores.w}/{st.scores.s}/
                                <span className="font-black text-primary ml-0.5">{st.scores.o}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-zinc-400 font-medium">
                              Chưa có học viên nào được gán cho lớp này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setSelectedClass(null)}
                className="h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 text-xs font-black uppercase"
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>
      )}

    </AcaLayout>
  );
}

function ClassTableList({ 
  classes, 
  onSelectClass 
}: { 
  classes: AcaClass[];
  onSelectClass: (cls: AcaClass) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
              <th className="px-6 py-4 min-w-[340px]">Tên lớp / Giáo viên (Click xem chi tiết)</th>
              <th className="px-6 py-4 min-w-[160px]">Ngày mở lớp</th>
              <th className="px-6 py-4 min-w-[160px]">Chặng hiện tại</th>
              <th className="px-6 py-4 min-w-[180px]">Khai giảng chặng</th>
              <th className="px-6 py-4 text-center min-w-[140px]">Sĩ số chặng</th>
              <th className="px-6 py-4 min-w-[220px]">Chặng tiếp theo</th>
              <th className="px-6 py-4 text-center min-w-[140px]">Cần tuyển</th>
              <th className="px-6 py-4 min-w-[180px]">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
            {classes.length > 0 ? (
              classes.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-zinc-50/80 align-middle cursor-pointer transition-colors"
                  onClick={() => onSelectClass(c)}
                  title="Click để xem thông tin chi tiết và danh sách học viên lớp này"
                >
                  <td className="px-6 py-4 min-w-[340px]">
                    <div className="font-black text-primary hover:underline">{c.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 font-bold">Giáo viên: {c.teacher}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 min-w-[160px]">{c.openDate}</td>
                  <td className="px-6 py-4 min-w-[160px]">
                    <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary uppercase">
                      {c.currentPhase}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 min-w-[180px]">{c.phaseStartDate}</td>
                  <td className="px-6 py-4 text-center font-bold tabular-nums text-foreground min-w-[140px]">{c.phaseStudents}</td>
                  <td className="px-6 py-4 min-w-[220px]">
                    <div className="text-zinc-800 font-black">{c.nextPhase}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Khai giảng: {c.nextPhaseStartDate}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold tabular-nums text-warning min-w-[140px]">{c.slotsToEnroll}</td>
                  <td className="px-6 py-4 min-w-[180px]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[9px] font-black uppercase text-success">
                      {c.type}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-zinc-400 font-medium">
                  Không có lớp nào bắt đầu hoặc hoạt động trong tháng này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
