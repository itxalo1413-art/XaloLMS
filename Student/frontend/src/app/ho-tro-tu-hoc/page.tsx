"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentLayout } from "@/app/StudentLayout";
import { NativeSelectChevron, Panel } from "@/components/student/ui";
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

const months = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const practiceClassDays = [3, 10, 17, 24];

export default function HoTroTuHocPage() {
  const [requests, setRequests] = useState<MockTestRequest[]>([]);
  const [viewDate, setViewDate] = useState(new Date(2026, 3, 1));
  const [regSkill, setRegSkill] = useState("Speaking Mock Test");
  const [regMonth, setRegMonth] = useState(viewDate.getMonth());
  const [regDay, setRegDay] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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
        label: t.skill,
        detail: `Giờ ${t.examTime ?? "—"} · ${t.examTeacher ?? "GV —"}`,
      }));
    const practiceEvents =
      viewDate.getMonth() === 3 && practiceClassDays.includes(selectedDay)
        ? [{ label: "Lớp luyện đề tập trung", detail: "19h45 - 21h30 · Sửa đề và chữa bài" }]
        : [];
    return [...mockEvents, ...practiceEvents];
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
            <div className="flex items-end">
              <button onClick={registerMockTest} className="w-full h-11 bg-foreground text-white rounded-xl text-xs font-black uppercase tracking-widest">
                Đăng ký
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {pendingTests.map((test) => (
              <div key={test.id} className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
                <div className="text-sm font-extrabold text-foreground">{test.skill}</div>
                <div className="text-[10px] font-bold text-muted uppercase mt-1">
                  {test.day} {months[test.month]}, {test.year} · Chờ ACA duyệt
                </div>
                <button onClick={() => cancelPendingRequest(test.id)} className="mt-3 text-xs font-bold text-secondary">
                  Hủy đăng ký
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Lớp luyện đề tập trung">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="text-xs font-bold text-zinc-800">Chủ Nhật</div>
              <div className="text-[11px] text-muted mt-1">9h - 11h30 · Làm đề tập trung</div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="text-xs font-bold text-zinc-800">Thứ 3</div>
              <div className="text-[11px] text-muted mt-1">19h45 - 21h30 · Sửa W - L - R</div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="text-xs font-bold text-zinc-800">Thứ 7</div>
              <div className="text-[11px] text-muted mt-1">19h45 - 21h30 · Sửa Speaking</div>
            </div>
          </div>
        </Panel>

        <Panel title="Thời khóa biểu tự học">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
              <button onClick={() => changeMonth(-1)} className="w-8 h-8 bg-white rounded-lg text-muted">{"<"}</button>
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
              <button onClick={() => changeMonth(1)} className="w-8 h-8 bg-white rounded-lg text-muted">{">"}</button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: prevMonthPadding }).map((_, i) => <div key={`pad-${i}`} className="h-8" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasApprovedMock = approvedTests.some(
                  (t) => t.day === day && t.month === viewDate.getMonth() && t.year === viewDate.getFullYear(),
                );
                const isPracticeDay = viewDate.getMonth() === 3 && practiceClassDays.includes(day);
                const active = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`h-8 rounded-lg text-[11px] font-bold relative ${
                      active ? "bg-primary text-white" : hasApprovedMock ? "bg-secondary-soft text-secondary" : isPracticeDay ? "bg-primary-soft text-primary" : "text-foreground/80 hover:bg-background"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-background/60 p-4">
              <div className="text-[10px] font-black text-muted uppercase tracking-widest">
                {selectedDay ? `Sự kiện ngày ${selectedDay}` : "Chọn ngày để xem sự kiện"}
              </div>
              <div className="mt-3 space-y-2">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-xs text-muted">Không có sự kiện trong ngày này.</div>
                ) : (
                  selectedDayEvents.map((event, idx) => (
                    <div key={idx} className="rounded-xl bg-white p-3">
                      <div className="text-xs font-bold text-foreground">{event.label}</div>
                      <div className="text-[11px] text-muted mt-1">{event.detail}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </StudentLayout>
  );
}
