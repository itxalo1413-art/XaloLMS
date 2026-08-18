"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { NativeSelectChevron } from "@/components/student/ui";
import {
  fetchAcaClasses,
  fetchAca11Classes,
  type AcaClass,
  type Aca11Class,
} from "@/lib/acaManagementApi";

import { getCachedAuthUser } from "@/lib/auth";
import { getLoggedInTeacherName, teacherNameMatches } from "@/lib/teacherIdentity";
import { fetchTeacherAttendance } from "@/lib/teacherAttendanceApi";

// Helper to count day occurrences in a month
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

// Helper to parse class schedule properties
interface ClassSchedule {
  days: number[];
  daysLabel: string;
  timeRange: string;
  duration: number;
  cleanName: string;
}

const parseClassSchedule = (name: string): ClassSchedule => {
  const nameLower = name.toLowerCase();
  
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
  
  let cleanName = "LỚP HỌC";
  if (nameLower.includes("momentum")) cleanName = "MOMENTUM";
  else if (nameLower.includes("upstream")) cleanName = "UPSTREAM";
  else if (nameLower.includes("soar")) cleanName = "SOAR";
  else if (nameLower.includes("advanced")) cleanName = "ADVANCED";
  else if (nameLower.includes("foundation")) cleanName = "FOUNDATION";
  else if (nameLower.includes("pre core")) cleanName = "PRE CORE";
  
  return { days, daysLabel, timeRange, duration, cleanName };
};

import {
  refreshWritingSubmissionsForTeacher,
  type WritingSubmission,
} from "@/lib/writingSubmissions";
import {
  refreshMockTestRequestsForAca,
  type MockTestRequest,
} from "@/lib/mockTestRequests";
import { isSpeakingMockTest } from "@/lib/selfStudyFormat";

export default function PerformancePage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [classes11, setClasses11] = useState<Aca11Class[]>([]);
  const [submissions, setSubmissions] = useState<WritingSubmission[]>([]);
  const [mockTests, setMockTests] = useState<MockTestRequest[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const loggedUser = getCachedAuthUser();
        setCurrentUser(loggedUser);

        const [cData, c11Data, subData, mtData, attMap] = await Promise.all([
          fetchAcaClasses(),
          fetchAca11Classes(),
          refreshWritingSubmissionsForTeacher("all"),
          refreshMockTestRequestsForAca(),
          fetchTeacherAttendance().catch(() => ({}) as Record<string, boolean>),
        ]);
        setClasses(cData);
        setClasses11(c11Data);
        setSubmissions(subData);
        setMockTests(mtData);
        setAttendance(attMap);
      } catch (err: any) {
        setError(err.message || "Không tải được dữ liệu hiệu suất.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeTeacherName = useMemo(() => getLoggedInTeacherName(), []);

  // Filter regular classes for active teacher for the selected month
  const filteredMyClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        c.month === selectedMonth &&
        (teacherNameMatches(c.teacher, activeTeacherName) || teacherNameMatches(c.name, activeTeacherName))
    );
  }, [classes, selectedMonth, activeTeacherName]);

  // Filter 1:1 active classes
  const my11Classes = useMemo(() => {
    return classes11.filter(
      (c) =>
        c.status === "Đang diễn ra" &&
        (teacherNameMatches(c.teacher, activeTeacherName) || teacherNameMatches(c.className, activeTeacherName))
    );
  }, [classes11, activeTeacherName]);

  // Teaching hour calculations (Actual vs. Expected)
  const hourStats = useMemo(() => {
    const year = new Date().getFullYear();
    const monthIndex = selectedMonth - 1;
    let expected = 0;
    let actual = 0;

    const details: { className: string; expectedHours: number; actualHours: number; scheduleText: string }[] = [];

    filteredMyClasses.forEach((c) => {
      const { days, daysLabel, duration, cleanName } = parseClassSchedule(c.name);
      if (days.length > 0) {
        const count = countDaysInMonth(year, monthIndex, days);
        const classExpected = count * duration;
        expected += classExpected;

        let classActual = 0;
        const totalDays = new Date(year, monthIndex + 1, 0).getDate();
        for (let d = 1; d <= totalDays; d++) {
          const dayOfWeek = new Date(year, monthIndex, d).getDay();
          if (!days.includes(dayOfWeek)) continue;
          const sessionId = `${c.id || c.classCode || "cls"}-${year}-${selectedMonth}-${d}`;
          if (attendance[sessionId]) classActual += duration;
        }
        actual += classActual;

        const timeLabel = c.name.toLowerCase().includes("c2") ? "Ca 2" : "Ca 1";

        details.push({
          className: `${cleanName} (${timeLabel})`,
          expectedHours: classExpected,
          actualHours: classActual,
          scheduleText: `${daysLabel} x ${duration.toFixed(2)}h`,
        });
      }
    });

    // 1:1 active classes calculation
    my11Classes.forEach((c11) => {
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
        
        // Parse time slot duration
        const durationParts = timeRange.split("-");
        let duration = 2.0;
        if (durationParts.length >= 2) {
          const start = durationParts[0].trim();
          const end = durationParts[1].trim();
          const [sh, sm] = start.split(":").map(Number);
          const [eh, em] = end.split(":").map(Number);
          if (!isNaN(sh) && !isNaN(eh)) {
            duration = ((eh * 60 + (em || 0)) - (sh * 60 + (sm || 0))) / 60;
          }
        }
        
        const classExpected = count * duration;
        expected += classExpected;
        const classActual = classExpected; // Assuming 100% attendance for 1:1
        actual += classActual;

        details.push({
          className: `1:1 ${c11.className.replace("2026RLP_ONL 1:1 ", "")}`,
          expectedHours: classExpected,
          actualHours: classActual,
          scheduleText: `${daysLabel} x ${duration.toFixed(2)}h`,
        });
      }
    });

    return { expected, actual, details };
  }, [filteredMyClasses, my11Classes, selectedMonth, attendance]);

  const teacherAttendanceLog = useMemo(() => {
    const log: { date: string; className: string; time: string; attendanceStatus: "Đúng giờ" | "Vắng dạy bù"; isLocked: boolean }[] = [];
    const year = new Date().getFullYear();
    const monthIndex = selectedMonth - 1;
    const today = new Date();
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= totalDays; d++) {
      const currentDate = new Date(year, monthIndex, d);
      if (currentDate > today) continue;
      const dayOfWeek = currentDate.getDay();

      filteredMyClasses.forEach((c) => {
        const { days, timeRange, cleanName } = parseClassSchedule(c.name);
        if (days.includes(dayOfWeek)) {
          const dateString = `${String(d).padStart(2, "0")}/${String(selectedMonth).padStart(2, "0")}/${year}`;
          const diffDays = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          const isLocked = diffDays > 7;
          const sessionId = `${c.id || c.classCode || "cls"}-${year}-${selectedMonth}-${d}`;
          log.push({
            date: dateString,
            className: cleanName,
            time: timeRange,
            attendanceStatus: attendance[sessionId] ? "Đúng giờ" : "Vắng dạy bù",
            isLocked,
          });
        }
      });
    }

    return log.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredMyClasses, selectedMonth, attendance]);

  // Grader performance statistics (Grade Writing & Test Speaking)
  const graderStats = useMemo(() => {
    const uName = (currentUser?.name || activeTeacherName || "").trim().toLowerCase();
    
    // Count graded writing submissions
    let writingGradedCount = 0;
    submissions.forEach((s) => {
      const gName = (s.assignedGrader || "").trim().toLowerCase();
      if (s.status === "graded" && (gName === uName || !currentUser)) {
        writingGradedCount++;
      }
    });

    // Count completed speaking mock test sessions
    let speakingDoneCount = 0;
    mockTests.forEach((mt) => {
      const tName = (mt.examTeacher || "").trim().toLowerCase();
      if (isSpeakingMockTest(mt.skill) && mt.score?.trim() && (tName === uName || !currentUser)) {
        speakingDoneCount++;
      }
    });

    return { writingGradedCount, speakingDoneCount };
  }, [submissions, mockTests, currentUser]);

  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Performance & Thống kê"
        subtitle={`Theo dõi giờ giảng dạy thực tế và hiệu suất chấm W, test S của giáo viên / Grader.`}
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8 space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Month Selector Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black uppercase text-muted tracking-wider">Chọn tháng thống kê:</label>
            <div className="w-48">
              <NativeSelectChevron
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-10 text-xs font-bold text-zinc-700 shadow-sm"
              >
                <option value={5}>Tháng 5 / {new Date().getFullYear()}</option>
                <option value={6}>Tháng 6 / {new Date().getFullYear()}</option>
                <option value={7}>Tháng 7 / {new Date().getFullYear()}</option>
                <option value={8}>Tháng 8 / {new Date().getFullYear()}</option>
              </NativeSelectChevron>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm">
            Đang tải dữ liệu hiệu suất...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column: Hours calculation & Grader Performance summary */}
            <div className="md:col-span-1 space-y-6">
              {/* Grader Performance Card */}
              <div className="bg-white rounded-2xl border border-purple-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                    Hiệu suất Grader (Chấm W & Test S)
                  </h3>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                    Cộng dồn Performance
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-purple-50/70 p-3.5 border border-purple-100 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-900">Test Speaking (Test S)</span>
                    <div className="text-xl font-black text-purple-900">{graderStats.speakingDoneCount} <span className="text-xs font-bold text-purple-600">ca đã xong</span></div>
                    <p className="text-[10px] text-purple-700/80 font-medium">Tính trực tiếp vào Performance</p>
                  </div>

                  <div className="rounded-xl bg-indigo-50/70 p-3.5 border border-indigo-100 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">Chấm Writing (Grade W)</span>
                    <div className="text-xl font-black text-indigo-900">{graderStats.writingGradedCount} <span className="text-xs font-bold text-indigo-600">bài đã chấm</span></div>
                    <p className="text-[10px] text-indigo-700/80 font-medium">Tính trực tiếp vào Performance</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 pb-2 border-b border-zinc-100">
                  Thống kê giờ dạy (Tháng {selectedMonth})
                </h3>
                
                <div className="space-y-4 pt-2">
                  <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold">Số giờ thực tế:</span>
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-sm">
                        {hourStats.actual.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-bold">Giờ dự kiến:</span>
                      <span className="font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg text-sm">
                        {hourStats.expected.toFixed(1)}h
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Chi tiết theo lớp</h4>
                    {hourStats.details.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-3 text-center italic">Không có lớp học tháng này.</p>
                    ) : (
                      hourStats.details.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-zinc-50 pb-2">
                          <div>
                            <div className="font-black text-zinc-800">{item.className}</div>
                            <div className="text-[10px] text-zinc-400 font-bold">{item.scheduleText}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-zinc-800">{item.actualHours.toFixed(1)}h</span>
                            <span className="text-[10px] text-zinc-400 font-bold block">Dự tính: {item.expectedHours.toFixed(1)}h</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Teacher attendance sheet & locked edits */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950">
                      Điểm danh giáo viên & Khóa chỉnh sửa
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                      Giáo viên tự tích điểm danh các buổi dạy. Nếu sau 7 ngày chưa tích, hệ thống tự động ghi nhận Vắng mặt và khóa chỉnh sửa.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase text-zinc-400">
                        <th className="px-4 py-3">Ngày</th>
                        <th className="px-4 py-3">Lớp học</th>
                        <th className="px-4 py-3">Khung giờ</th>
                        <th className="px-4 py-3 text-center">Điểm danh</th>
                        <th className="px-4 py-3 text-right">Khóa chỉnh sửa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {teacherAttendanceLog.length > 0 ? (
                        teacherAttendanceLog.map((logItem, index) => (
                          <tr key={index} className="hover:bg-zinc-50/50 align-middle">
                            <td className="px-4 py-3 tabular-nums text-zinc-950 font-bold">{logItem.date}</td>
                            <td className="px-4 py-3">{logItem.className}</td>
                            <td className="px-4 py-3 text-zinc-500 tabular-nums">{logItem.time}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                logItem.attendanceStatus === "Đúng giờ"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {logItem.attendanceStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {logItem.isLocked ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-zinc-400 uppercase">
                                  <svg className="w-3 h-3 text-zinc-450 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                  </svg>
                                  Khóa sửa
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-primary hover:underline font-black text-[10px] uppercase"
                                  onClick={() => alert(`Cho phép chỉnh sửa buổi học ngày ${logItem.date}`)}
                                >
                                  <svg className="w-3 h-3 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 18.062a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                  Có thể sửa
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-zinc-400 font-medium">
                            Chưa có dữ liệu điểm danh.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </TeacherLayout>
  );
}
