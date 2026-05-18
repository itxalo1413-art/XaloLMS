"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentLayout } from "@/app/StudentLayout";
import { NativeSelectChevron, Panel, Select } from "@/components/student/ui";
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
import { isSameCalendarDay, useClientToday } from "@/hooks/useClientToday";

const months = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const practiceClassDays = [3, 10, 17, 24];
const mainCourseDays = [21, 23, 25, 28, 30];

export default function HoTroTuHocPage() {
  const clientToday = useClientToday();
  const [requests, setRequests] = useState<MockTestRequest[]>([]);
  const [viewDate, setViewDate] = useState(new Date(2026, 3, 1));
  const [regSkill, setRegSkill] = useState("Speaking Mock Test");
  const [regMonth, setRegMonth] = useState(viewDate.getMonth());
  const [regDay, setRegDay] = useState(1);
  const [regTime, setRegTime] = useState("09:00");
  const [selectedHour, setSelectedHour] = useState("19");
  const [selectedMinute, setSelectedMinute] = useState("45");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [writingLink, setWritingLink] = useState("");
  const [submittedWriting, setSubmittedWriting] = useState<{link: string, date: string, status: string} | null>(null);

  const syncRequests = useCallback(() => {
    setRequests(loadMockTestRequests());
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) syncRequests();
    });
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

  const getDaysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) =>
    new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewDate.getMonth(), viewDate.getFullYear());
  const firstDay = getFirstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());
  const prevMonthPadding = (firstDay + 6) % 7;

  const registerMockTest = () => {
    const year = viewDate.getFullYear();
    if (hasDuplicateSlot(DEMO_STUDENT.id, regSkill, regDay, regMonth, year)) {
      alert("Bạn đã có đăng ký cho kỹ năng và ngày này.");
      return;
    }
    const row = createPendingRequest({
      studentId: DEMO_STUDENT.id,
      studentName: DEMO_STUDENT.name,
      skill: regSkill,
      day: regDay,
      month: regMonth,
      year,
      examTime: regTime,
    });
    saveMockTestRequests([...loadMockTestRequests(), row]);
  };

  const cancelPendingRequest = (id: string) => {
    const row = loadMockTestRequests().find((t) => t.id === id);
    if (row?.status !== "pending") return;
    removeMockTestRequest(id);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
    setRegMonth(newDate.getMonth());
    setSelectedDay(null);
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const mockEvents = approvedTests
      .filter(
        (t) =>
          t.day === selectedDay &&
          t.month === viewDate.getMonth() &&
          t.year === viewDate.getFullYear(),
      )
      .map((t) => ({
        type: "mock" as const,
        label: t.skill,
        detail: `Giờ ${t.examTime ?? "—"} · ${t.examTeacher ?? "GV —"}`,
      }));
    const practiceEvents =
      viewDate.getMonth() === 3 && practiceClassDays.includes(selectedDay)
        ? [{ type: "practice" as const, label: "Lớp luyện đề tập trung", detail: "19h45 - 21h30 · Sửa đề và chữa bài" }]
        : [];
    const courseEvents =
      viewDate.getMonth() === 3 && mainCourseDays.includes(selectedDay)
        ? [{ type: "course" as const, label: "Lớp chính khóa", detail: "19h45 - 21h30 · Offline Momentum" }]
        : [];
    return [...mockEvents, ...practiceEvents, ...courseEvents];
  }, [approvedTests, selectedDay, viewDate]);

  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Hỗ trợ tự học</h2>
          <p className="text-muted text-sm mt-1 font-medium">
            Đăng ký mock test, chấm chữa writing và theo dõi lớp luyện đề tập trung.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Interactions & Content */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <Panel title="Đăng ký Mock Test Speaking">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-background p-6 rounded-3xl shadow-inner">
                <div className="flex flex-col gap-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Kỹ năng</label>
                  <NativeSelectChevron
                    value={regSkill}
                    onChange={(e) => setRegSkill(e.target.value)}
                    className="h-11 rounded-xl bg-white text-xs font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/10"
                  >
                    <option>Speaking Mock Test</option>
                    <option>Writing Mock Test</option>
                  </NativeSelectChevron>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Tháng</label>
                  <NativeSelectChevron
                    value={regMonth}
                    onChange={(e) => setRegMonth(parseInt(e.target.value, 10))}
                    className="h-11 rounded-xl bg-white text-xs font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/10"
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </NativeSelectChevron>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Ngày</label>
                  <NativeSelectChevron
                    value={regDay}
                    onChange={(e) => setRegDay(parseInt(e.target.value, 10))}
                    className="h-11 rounded-xl bg-white text-xs font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/10"
                  >
                    {Array.from({ length: getDaysInMonth(regMonth, viewDate.getFullYear()) }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Ngày {i + 1}
                      </option>
                    ))}
                  </NativeSelectChevron>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Giờ</label>
                  <NativeSelectChevron
                    value={regTime}
                    onChange={(e) => setRegTime(e.target.value)}
                    className="h-11 rounded-xl bg-white text-xs font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/10"
                  >
                    {["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00", "15:30", "16:00", "19:45"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </NativeSelectChevron>
                </div>
                <div className="flex items-end sm:col-span-4">
                  <button onClick={registerMockTest} className="w-full h-11 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all">
                    Đăng ký
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {pendingTests.map((test) => (
                  <div key={test.id} className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex justify-between items-start">
                    <div>
                      <div className="text-sm font-extrabold text-foreground">{test.skill}</div>
                      <div className="text-[10px] font-bold text-muted uppercase mt-1">
                        Ngày {test.day} {months[test.month]}, {test.year} · Giờ {test.examTime}
                      </div>
                      <div className="mt-1 text-[10px] font-bold text-warning uppercase">Chờ ACA duyệt</div>
                    </div>
                    <button onClick={() => cancelPendingRequest(test.id)} className="text-[10px] font-black uppercase text-secondary hover:underline">
                      Hủy
                    </button>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <Panel title="Chấm - Chữa Writing" className="h-full">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Link bài làm (Google Docs)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={writingLink}
                        onChange={(e) => setWritingLink(e.target.value)}
                        placeholder="Dán link Google Docs vào đây..."
                        className="flex-1 h-11 rounded-xl border border-zinc-200 bg-background px-4 text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      />
                      <button 
                        onClick={() => {
                          if(!writingLink) return;
                          setSubmittedWriting({ link: writingLink, date: new Date().toLocaleDateString('vi-VN'), status: 'Chờ chấm' });
                          setWritingLink("");
                        }}
                        className="px-4 h-11 bg-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary/90 transition-all"
                      >
                        Gửi bài
                      </button>
                    </div>
                  </div>

                  {submittedWriting && (
                    <div className="mt-4 p-4 rounded-2xl bg-background border border-secondary/10">
                      <div className="flex justify-between items-center">
                        <div className="text-[11px] font-bold text-foreground truncate max-w-[200px]">{submittedWriting.link}</div>
                        <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[9px] font-black uppercase">{submittedWriting.status}</span>
                      </div>
                      <div className="mt-1 text-[10px] text-muted font-medium">Gửi ngày: {submittedWriting.date}</div>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-zinc-100">
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-4">Kết quả chấm gần nhất</div>
                    <div className="rounded-2xl border-2 border-secondary/20 bg-secondary/5 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-foreground">Task 2: Education System</div>
                        <div className="text-[10px] text-muted mt-1">Chấm ngày 10/05/2026</div>
                      </div>
                      <div className="text-2xl font-black text-secondary">6.5</div>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel title="Bảng điểm hỗ trợ tự học" className="h-full">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Mock Test Speaking", score: "7.0", date: "05/05/2026", color: "text-primary", bg: "bg-primary/5" },
                    { label: "Mock Test Writing", score: "6.0", date: "02/05/2026", color: "text-info", bg: "bg-info/5" },
                    { label: "Writing Correction 1", score: "6.5", date: "10/05/2026", color: "text-secondary", bg: "bg-secondary/5" },
                    { label: "Writing Correction 2", score: "—", date: "Pending", color: "text-muted", bg: "bg-background" },
                  ].map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl ${item.bg} border border-zinc-100 flex flex-col justify-between h-32`}>
                      <div>
                        <div className="text-[9px] font-black text-muted uppercase tracking-widest">{item.label}</div>
                        <div className="text-[10px] text-muted mt-1 font-medium">{item.date}</div>
                      </div>
                      <div className={`text-3xl font-black ${item.color}`}>{item.score}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          {/* Right Column: Schedule */}
          <div className="lg:col-span-4 flex flex-col">
            <Panel title="Thời khóa biểu tự học" className="h-full">
              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-inner">
                  <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-muted hover:text-primary transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-widest">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                  <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-muted hover:text-primary transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                  </button>
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
                    const isToday = isSameCalendarDay(
                      clientToday,
                      day,
                      viewDate.getMonth(),
                      viewDate.getFullYear(),
                    );
                    const isPracticeDay = viewDate.getMonth() === 3 && practiceClassDays.includes(day);
                    const isCourseDay = viewDate.getMonth() === 3 && mainCourseDays.includes(day);

                    const isHighlighted = isPracticeDay || isCourseDay || isApprovedMock || isToday;
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          if (!isHighlighted) return;
                          setSelectedDay((prev) => (prev === day ? null : day));
                        }}
                        className={`h-8 w-full flex items-center justify-center text-[11px] font-bold rounded-lg relative transition-all ${
                          isSelected ? "ring-2 ring-primary/35" : ""
                        } ${
                          isToday
                            ? 'bg-primary text-white shadow-premium scale-110 z-10'
                            : isPracticeDay || isCourseDay
                              ? 'bg-primary-soft text-primary shadow-sm'
                              : isApprovedMock
                                ? 'bg-secondary-soft text-secondary shadow-sm'
                                : 'text-foreground/50'
                        } ${isHighlighted ? "cursor-pointer" : "cursor-default"}`}
                      >
                        {day}
                        {isApprovedMock && !isToday && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-secondary rounded-full ring-2 ring-white"></div>}
                        {(isPracticeDay || isCourseDay) && !isToday && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-background space-y-6">
                  <h4 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    Sự kiện & Nhắc hẹn
                  </h4>
                  <div className="rounded-xl border border-primary/10 bg-background/60 p-3">
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest">
                      {selectedDay
                        ? `Sự kiện ngày ${selectedDay} ${months[viewDate.getMonth()]}`
                        : "Chọn ngày highlight để xem sự kiện"}
                    </div>
                    <div className="mt-2 space-y-2">
                      {selectedDay ? (
                        selectedDayEvents.length > 0 ? (
                          selectedDayEvents.map((event, idx) => (
                            <div key={`${event.type}-${idx}`} className="rounded-lg bg-white p-3">
                              <div className="text-xs font-bold text-foreground">{event.label}</div>
                              <div className="mt-1 text-[11px] text-muted">{event.detail}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-muted">
                            Không có sự kiện được duyệt trong ngày này.
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
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

        <div className="mt-10 flex w-full flex-col gap-10">
            <Panel title="Đăng ký Lớp luyện đề tập trung" className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-background p-6 rounded-3xl shadow-inner">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Tháng</label>
                  <Select
                    value={regMonth.toString()}
                    onChange={(v) => setRegMonth(parseInt(v))}
                    options={months.map((m, i) => ({ value: i.toString(), label: m }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Ngày</label>
                  <Select
                    value={regDay.toString()}
                    onChange={(v) => setRegDay(parseInt(v))}
                    options={Array.from({ length: daysInMonth }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: `Ngày ${i + 1}`,
                    }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Giờ</label>
                  <Select
                    value={selectedHour}
                    onChange={(v) => setSelectedHour(v)}
                    options={Array.from({ length: 24 }, (_, i) => ({
                      value: i.toString().padStart(2, "0"),
                      label: i.toString().padStart(2, "0") + " h",
                    }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Phút</label>
                  <Select
                    value={selectedMinute}
                    onChange={(v) => setSelectedMinute(v)}
                    options={["00", "15", "30", "45"].map((m) => ({
                      value: m,
                      label: m + " m",
                    }))}
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => {
                      const practiceRequests = myRequests.filter(r => r.skill === "Lớp luyện đề tập trung");
                      
                      const sameWeekRequests = practiceRequests.filter(r => 
                        r.month === regMonth && 
                        Math.abs(r.day - regDay) <= 6
                      );

                      if (sameWeekRequests.length >= 2) {
                        alert("Bạn chỉ được đăng ký tối đa 2 buổi luyện đề mỗi tuần. Vui lòng chọn tuần khác hoặc liên hệ ACA.");
                        return;
                      }

                      const fullTime = `${selectedHour}:${selectedMinute}`;
                      const confirmReg = confirm(`Xác nhận đăng ký Lớp luyện đề tập trung ngày ${regDay}/${regMonth + 1} lúc ${fullTime}?`);
                      if (confirmReg) {
                         const row = createPendingRequest({
                           studentId: DEMO_STUDENT.id,
                           studentName: DEMO_STUDENT.name,
                           skill: "Lớp luyện đề tập trung",
                           day: regDay,
                           month: regMonth,
                           year: viewDate.getFullYear(),
                           examTime: fullTime
                         });
                         saveMockTestRequests([...loadMockTestRequests(), row]);
                         alert("Đăng ký thành công! Vui lòng chờ ACA duyệt.");
                      }
                    }}
                    className="w-full h-11 rounded-2xl bg-primary text-[11px] font-black uppercase tracking-widest text-white hover:bg-primary/90 shadow-premium transition-all"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </div>
              <div className="mt-4 px-2">
                <p className="text-[10px] text-muted font-medium italic">
                  * Lưu ý: Mỗi học viên chỉ được đăng ký tối đa 02 buổi luyện đề/tuần để đảm bảo chất lượng giảng dạy.
                </p>
              </div>
            </Panel>
            <Panel title="Lớp luyện đề — Mock Test Scores" className="w-full">
              <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-white">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-background/50">
                      {["TEST", "HỌC VIÊN", "LISTENING", "READING", "WRITING", "SPEAKING"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-primary/5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {[
                      { test: "LĐ16", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
                      { test: "LĐ17", name: "Dương Ngọc Khôi Nguyên", l: "6.0", r: "5.5", w: "4.5", s: "—" },
                      { test: "LĐ18", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
                      { test: "LĐ19", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
                      { test: "LĐ20", name: "Dương Ngọc Khôi Nguyên", l: "—", r: "—", w: "—", s: "—" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-background/30 transition-colors">
                        <td className="px-4 py-4 text-xs font-bold text-foreground">{row.test}</td>
                        <td className="px-4 py-4 text-xs font-bold text-muted">{row.name}</td>
                        <td className="px-4 py-4 text-xs font-black text-foreground">{row.l}</td>
                        <td className="px-4 py-4 text-xs font-black text-foreground">{row.r}</td>
                        <td className="px-4 py-4 text-xs font-black text-foreground">{row.w}</td>
                        <td className="px-4 py-4 text-xs font-black text-foreground">{row.s}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
        </div>
      </div>
    </StudentLayout>
  );
}
