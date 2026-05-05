"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentLayout } from "@/app/StudentLayout";
import { Panel } from "@/components/student/ui";
import {
  createPendingRequest,
  DEMO_STUDENT,
  hasDuplicateSlot,
  loadMockTestRequests,
  MOCK_TEST_UPDATE_EVENT,
  removeMockTestRequest,
  saveMockTestRequests,
  type MockTestRequest,
} from "@/lib/mockTestRequests";

const courseOverview = {
  course: "Offline Momentum",
  startDate: "Chặng 1: 21/04/2026 • Chặng 2: 11/06/2026 (dự kiến)",
  schedule: "T357, 19h45-21h30",
  instructor: "Nghiêm Doãn Quỳnh Châu",
  room: "Phòng 3.1",
  zoomPassword: "—",
};

const importantLinks = [
  { id: "rlp", label: "RLP", value: "2026RLP_OFF - M T/T/S - 19452130 - 210426" },
  { id: "lesson", label: "THƯ MỤC BÀI GIẢNG", value: "Writing - Listening (21/04/2026)" },
  { id: "homework", label: "THƯ MỤC BÀI TẬP", value: "HW Dương Ngọc Khôi Nguyên" },
  { id: "survey", label: "KHẢO SÁT HỌC VIÊN", value: "—" },
];

const sessions = [
  {
    code: "R1.1",
    no: 1,
    target: "READING: Làm quen, tổng quát và luyện tập các dạng bài Completion, Multiple choice và Information Identification \n\nSPEAKING: Làm quen, tổng quát và luyện tập các chủ đề cơ bản trong Part 1 và các chủ đề sử dụng Descriptive language trong Part 2 - Part 3",
    skill: "Speaking",
    teacher: "-",
    contents: "Giới thiệu Speaking IELTS\nGiới thiệu Speaking Part 1\n- Hiểu tính chất của Part 1 và trả lời với độ dài phù hợp\n- Chiến thuật trả lời các câu hỏi trong Part 1 (Công việc, Quê hương, Sở thích, Du lịch...)\n- Luyện tập, áp dụng chiến thuật"
  },
  // (Adding a few more for demo purposes)
  {
    code: "R1.2",
    no: 2,
    target: "",
    skill: "Speaking",
    teacher: "-",
    contents: "Giới thiệu Speaking Part 2\n- Hiểu tính chất của Part 2 và trả lời trong khung thời gian\n- Chiến thuật trả lời Descriptive language (Miêu tả người)\n- Luyện tập, áp dụng chiến thuật"
  }
];

const months = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

export default function CourseInfoPage() {
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const [requests, setRequests] = useState<MockTestRequest[]>([]);

  const [viewDate, setViewDate] = useState(new Date(2026, 3, 1)); // Tháng 4, 2026
  const [regSkill, setRegSkill] = useState("Speaking Mock Test");
  const [regMonth, setRegMonth] = useState(viewDate.getMonth());
  const [regDay, setRegDay] = useState(1);

  const syncRequests = useCallback(() => {
    setRequests(loadMockTestRequests());
  }, []);

  useEffect(() => {
    let cancelled = false;
    function pull() {
      if (!cancelled) syncRequests();
    }
    queueMicrotask(pull);
    window.addEventListener(MOCK_TEST_UPDATE_EVENT, syncRequests);
    window.addEventListener("storage", syncRequests);
    return () => {
      cancelled = true;
      window.removeEventListener(MOCK_TEST_UPDATE_EVENT, syncRequests);
      window.removeEventListener("storage", syncRequests);
    };
  }, [syncRequests]);

  const myRequests = useMemo(
    () => requests.filter((r) => r.studentId === DEMO_STUDENT.id),
    [requests],
  );
  const approvedTests = useMemo(
    () => myRequests.filter((r) => r.status === "approved"),
    [myRequests],
  );
  const pendingTests = useMemo(
    () => myRequests.filter((r) => r.status === "pending"),
    [myRequests],
  );

  const handleLinkClick = (id: string) => {
    setActiveLink(activeLink === id ? null : id);
  };

  const registerMockTest = () => {
    const year = viewDate.getFullYear();
    if (
      hasDuplicateSlot(DEMO_STUDENT.id, regSkill, regDay, regMonth, year)
    ) {
      alert(
        "Bạn đã có đăng ký cho kỹ năng và ngày này (đang chờ duyệt hoặc đã được duyệt).",
      );
      return;
    }
    const row = createPendingRequest({
      studentId: DEMO_STUDENT.id,
      studentName: DEMO_STUDENT.name,
      skill: regSkill,
      day: regDay,
      month: regMonth,
      year,
    });
    saveMockTestRequests([...loadMockTestRequests(), row]);
  };

  const cancelPendingRequest = (id: string) => {
    const row = loadMockTestRequests().find((t) => t.id === id);
    if (row?.status !== "pending") {
      alert("Chỉ có thể hủy yêu cầu đang chờ ACA duyệt.");
      return;
    }
    removeMockTestRequest(id);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
    setRegMonth(newDate.getMonth());
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewDate.getMonth(), viewDate.getFullYear());
  const firstDay = getFirstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());
  const prevMonthPadding = (firstDay + 6) % 7; 

  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Skill</h2>
          <p className="text-muted text-sm mt-1 font-medium">Thông tin kỹ năng, lịch học và lịch Mock Test cá nhân.</p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          
          <div className="lg:col-span-8 space-y-10">
            <Panel title="Tổng quan Skill">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { label: "Khoá học", value: courseOverview.course, icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
                  { label: "Lịch học", value: courseOverview.schedule, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                  { label: "Giảng viên", value: courseOverview.instructor, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                  { label: "Phòng học", value: courseOverview.room, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                  { label: "Ngày khai giảng", value: courseOverview.startDate, span: true, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                ].map((item, i) => (
                  <div key={i} className={`flex gap-4 items-start ${item.span ? 'sm:col-span-2' : ''}`}>
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={item.icon} /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-bold text-foreground mt-1">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Đăng ký Mock Test">
              <p className="mb-6 text-xs font-medium leading-relaxed text-muted">
                Sau khi bấm <strong>Đăng ký</strong>, yêu cầu ở trạng thái{" "}
                <strong>chờ ACA duyệt</strong>. ACA sẽ gán <strong>giờ thi</strong> và{" "}
                <strong>giáo viên test</strong>. Chỉ khi được duyệt, ca thi mới hiện trên{" "}
                <strong>Lịch</strong> bên phải và trong mục sự kiện.
              </p>
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-background p-6 rounded-3xl shadow-inner">
                  <div className="flex flex-col gap-2 sm:col-span-1">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Kỹ năng</label>
                    <select value={regSkill} onChange={(e) => setRegSkill(e.target.value)} className="h-11 w-full rounded-xl bg-white px-4 text-xs font-bold text-foreground shadow-sm outline-none focus:ring-4 focus:ring-primary/5">
                      <option>Speaking Mock Test</option><option>Writing Mock Test</option><option>Listening Mock Test</option><option>Reading Mock Test</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Tháng</label>
                    <select value={regMonth} onChange={(e) => setRegMonth(parseInt(e.target.value))} className="h-11 w-full rounded-xl bg-white px-4 text-xs font-bold text-foreground shadow-sm outline-none focus:ring-4 focus:ring-primary/5">
                      {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Ngày</label>
                    <select value={regDay} onChange={(e) => setRegDay(parseInt(e.target.value))} className="h-11 w-full rounded-xl bg-white px-4 text-xs font-bold text-foreground shadow-sm outline-none focus:ring-4 focus:ring-primary/5">
                      {Array.from({ length: getDaysInMonth(regMonth, viewDate.getFullYear()) }).map((_, i) => (
                        <option key={i+1} value={i+1}>Ngày {i+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={registerMockTest} className="w-full h-11 bg-foreground text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-premium hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95">Đăng ký</button>
                  </div>
                </div>

                {pendingTests.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning"></div>
                      Chờ ACA duyệt
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {pendingTests.map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-5 rounded-2xl border border-warning/25 bg-warning/5 shadow-soft group hover:shadow-hover transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center text-warning font-black text-sm">
                              {test.skill.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-foreground">{test.skill}</div>
                              <div className="text-[10px] font-bold text-muted uppercase mt-1">{test.day} {months[test.month]}, {test.year}</div>
                              <div className="text-[9px] font-bold text-warning mt-1 uppercase tracking-tight">Chưa có trên lịch</div>
                            </div>
                          </div>
                          <button type="button" onClick={() => cancelPendingRequest(test.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm text-muted hover:text-danger transition-all">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {approvedTests.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary"></div>
                      Đã được duyệt (hiển thị trên lịch)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {approvedTests.map((test) => (
                        <div key={test.id} className="flex items-start justify-between gap-3 p-5 rounded-2xl bg-gradient-to-tr from-secondary/5 to-white shadow-soft group hover:shadow-hover transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-sm shrink-0">
                              {test.skill.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-foreground">{test.skill}</div>
                              <div className="text-[10px] font-bold text-muted uppercase mt-1">{test.day} {months[test.month]}, {test.year}</div>
                              <div className="text-[10px] font-bold text-secondary mt-1">
                                Giờ: {test.examTime ?? "—"} · GV: {test.examTeacher ?? "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <Panel title="Liên kết quan trọng">
              <div className="flex flex-wrap gap-3">
                {importantLinks.map((link) => (
                  <button key={link.id} onClick={() => handleLinkClick(link.id)} className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-soft transition-all active:scale-95 ${activeLink === link.id ? 'bg-primary text-white shadow-premium' : 'bg-white text-muted hover:text-foreground hover:bg-background'}`}>{link.label}</button>
                ))}
              </div>
              {activeLink && (
                <div className="mt-6 p-6 bg-foreground rounded-2xl shadow-premium flex items-center justify-between group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Giá trị liên kết</span>
                    <span className="text-base font-bold text-white truncate max-w-[300px] md:max-w-[500px] block">{importantLinks.find(l => l.id === activeLink)?.value}</span>
                  </div>
                  <button className="relative z-10 bg-white text-foreground px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:shadow-premium transition-all">Truy cập</button>
                </div>
              )}
            </Panel>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <Panel title="Thời khoá biểu">
              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-inner">
                  <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-muted hover:text-primary transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 19l-7-7 7-7" /></svg></button>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-widest">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                  <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-muted hover:text-primary transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg></button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (<div key={day} className="text-center text-[10px] font-black text-muted uppercase tracking-widest">{day}</div>))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: prevMonthPadding }).map((_, i) => (<div key={`pad-${i}`} className="h-8"></div>))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isApprovedMock = approvedTests.some(
                      (t) =>
                        t.day === day &&
                        t.month === viewDate.getMonth() &&
                        t.year === viewDate.getFullYear(),
                    );
                    const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth() && new Date().getFullYear() === viewDate.getFullYear();
                    const isCourseDay = viewDate.getMonth() === 3 && [21, 23, 25, 28, 30].includes(day);

                    return (
                      <div key={day} className={`h-8 flex items-center justify-center text-[11px] font-bold rounded-lg relative transition-all cursor-pointer ${isToday ? 'bg-primary text-white shadow-premium scale-110 z-10' : isCourseDay ? 'bg-primary-soft text-primary shadow-sm' : isApprovedMock ? 'bg-secondary-soft text-secondary shadow-sm' : 'text-foreground/80 hover:bg-background'}`}>
                        {day}
                        {isApprovedMock && !isToday && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-secondary rounded-full ring-2 ring-white"></div>}
                        {isCourseDay && !isToday && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-background space-y-6">
                  <h4 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    Sự kiện & Nhắc hẹn
                  </h4>
                  <div className="space-y-4">
                    {approvedTests
                      .filter(
                        (t) =>
                          t.month === viewDate.getMonth() &&
                          t.year === viewDate.getFullYear(),
                      )
                      .map((test) => (
                        <div key={test.id} className="flex items-center gap-4 p-4 bg-background rounded-2xl hover:bg-white hover:shadow-soft transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                          <div>
                            <div className="text-xs font-black text-foreground">{test.skill}</div>
                            <div className="text-[10px] font-bold text-muted uppercase mt-1">Ngày {test.day} {months[test.month]} {test.year}</div>
                            <div className="text-[10px] font-semibold text-secondary mt-0.5">
                              Giờ {test.examTime ?? "—"} · {test.examTeacher ?? "GV —"}
                            </div>
                          </div>
                        </div>
                      ))}
                    {approvedTests.filter(
                      (t) =>
                        t.month === viewDate.getMonth() &&
                        t.year === viewDate.getFullYear(),
                    ).length === 0 && pendingTests.filter(
                      (t) =>
                        t.month === viewDate.getMonth() &&
                        t.year === viewDate.getFullYear(),
                    ).length === 0 && (
                      <div className="text-[10px] text-muted italic bg-background/50 p-4 rounded-xl text-center">Không có mock test đã duyệt trong tháng này. Yêu cầu đang chờ sẽ không hiện ở lịch.</div>
                    )}
                    {approvedTests.filter(
                      (t) =>
                        t.month === viewDate.getMonth() &&
                        t.year === viewDate.getFullYear(),
                    ).length === 0 && pendingTests.filter(
                      (t) =>
                        t.month === viewDate.getMonth() &&
                        t.year === viewDate.getFullYear(),
                    ).length > 0 && (
                      <div className="text-[10px] font-medium text-warning bg-warning/10 p-3 rounded-xl border border-warning/20">Bạn có ca chờ ACA duyệt trong tháng này — chưa hiển thị trên lịch.</div>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
