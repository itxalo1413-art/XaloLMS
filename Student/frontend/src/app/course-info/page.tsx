"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentLayout } from "@/app/StudentLayout";
import { Panel } from "@/components/student/ui";
import Link from "next/link";
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

const courseOverview = {
  course: "Offline Momentum",
  phases: [
    { name: "Chặng 1", date: "21/04/2026" },
    { name: "Chặng 2", date: "11/06/2026 (dự kiến)" }
  ],
  schedule: [
    "Thứ 3: 19h45 - 21h30",
    "Thứ 5: 19h45 - 21h30",
    "Thứ 7: 19h45 - 21h30"
  ],
  instructor: "Nghiêm Doãn Quỳnh Châu",
  room: "Phòng 3.1",
  zoomPassword: "—",
};

function CourseOverviewSection() {
  const basics = [
    {
      label: "Khoá học",
      value: courseOverview.course,
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      label: "Giảng viên",
      value: courseOverview.instructor,
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      label: "Phòng học",
      value: courseOverview.room,
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {basics.map((item) => (
          <div
            key={item.label}
            className="flex h-full gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={item.icon} />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">{item.label}</div>
              <div className="mt-1.5 text-sm font-bold leading-snug text-foreground">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex h-full gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">Lịch học</div>
            <ul className="mt-2 space-y-1.5">
              {courseOverview.schedule.map((slot) => (
                <li key={slot} className="text-sm font-bold text-foreground">
                  {slot}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex h-full gap-3 rounded-2xl border border-primary/10 bg-background/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">Ngày khai giảng</div>
            <ul className="mt-2 space-y-1.5">
              {courseOverview.phases.map((p) => (
                <li key={p.name} className="text-sm font-bold text-foreground">
                  {p.name === "Chặng 1" ? (
                    <Link
                      href="#rlp-section"
                      className="text-primary hover:underline decoration-2 underline-offset-4"
                    >
                      {p.name}
                    </Link>
                  ) : (
                    <span>{p.name}</span>
                  )}
                  <span className="text-muted"> · </span>
                  <span>{p.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const importantLinks = [
  { id: "rlp", label: "RLP", value: "Chặng 1: Speaking - Reading" },
  { id: "lesson", label: "THƯ MỤC BÀI GIẢNG", value: "Writing - Listening (21/04/2026)" },
  { id: "homework", label: "THƯ MỤC BÀI TẬP", value: "HW Dương Ngọc Khôi Nguyên" },
  { id: "survey", label: "KHẢO SÁT HỌC VIÊN", value: "—" },
];

const sessions = [
  {
    no: 1,
    date: "02/10/2025",
    skill: "Speaking",
    contents:
      "Introduction to Speaking Part 1 - chiến thuật trả lời chủ đề Work, Hobbies, Travel",
    teacherNote: "Đã nắm được đủ cấu trúc trả lời Part 1, mở rộng ví linh hoạt được.",
  },
  {
    no: 2,
    date: "04/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Descriptive language, Describe a person",
    teacherNote: "Hiểu yêu cầu Part 2, thiếu từ vựng cụ thể, cần luyện thêm chèn story.",
  },
  {
    no: 3,
    date: "09/10/2025",
    skill: "Reading",
    contents: "Reading - Matching headings, Sentence endings",
    teacherNote: "Nắm cách định vị đáp án Completion, làm được từ khóa T/F/NG.",
  },
  {
    no: 4,
    date: "11/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Describe an item, phát âm & giọng cuối câu",
    teacherNote: "Cần chú ý hạ giọng khi phát âm, đã biết ở cuối câu hay cụm từ.",
  },
  {
    no: 5,
    date: "16/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 3 - Chiến thuật câu hỏi, phát triển ý",
    teacherNote: "Nắm được cách kéo dài để suy nghĩ idea cho Part 3.",
  },
  {
    no: 6,
    date: "18/10/2025",
    skill: "Reading",
    contents: "Reading - Matching features, Matching information",
    teacherNote: "Hiểu cách đọc dày để áp dụng vào bài Matching headings.",
  },
  {
    no: 7,
    date: "18/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Describe a place, cleft sentence",
    teacherNote: "Hiểu ứng dụng cleft sentence, cần luyện thêm để thành nhuần nhuyễn.",
  },
  {
    no: 8,
    date: "21/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 & 3 liên tục, tạo ngữ cơ bản, nguyên âm đôi",
    teacherNote: "Nắm mẫu câu tạo ngữ căn bản, cần luyện phát âm nguyên âm đôi.",
  },
  {
    no: 9,
    date: "23/10/2025",
    skill: "Reading",
    contents: "Reading - Multiple choice (Passage 2)",
    teacherNote: "Xử lý tốt dạng multiple choice đoạn học thuật.",
  },
  {
    no: 10,
    date: "25/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 1 - Accommodation, Sport, Transportation",
    teacherNote: "Diễn đạt hẹp hơn, nắm thành phần câu cơ bản.",
  },
  {
    no: 11,
    date: "28/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Story telling, Describe an experience",
    teacherNote: "Luyện cụm động từ danh từ, đa phần hình thành cụm danh từ cơ bản.",
  },
  {
    no: 12,
    date: "30/10/2025",
    skill: "Reading",
    contents: "Reading - Information Identification (T/F/NG, Y/N/NG)",
    teacherNote: "Nắm cách đọc lấy thông tin và so sánh với câu hỏi.",
  },
];

const practiceClassDays = [3, 10, 17, 24];

const months = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

export default function CourseInfoPage() {
  const clientToday = useClientToday();
  const [requests, setRequests] = useState<MockTestRequest[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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
    setSelectedDay(null);
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewDate.getMonth(), viewDate.getFullYear());
  const firstDay = getFirstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());
  const prevMonthPadding = (firstDay + 6) % 7; 
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const approvedEvents = approvedTests
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

    const isCourseDay =
      viewDate.getMonth() === 3 && [21, 23, 25, 28, 30].includes(selectedDay);
    const courseEvent = isCourseDay
      ? [
          {
            type: "course" as const,
            label: "Lớp chính khóa",
            detail: "19h45 - 21h30 · Offline Momentum",
          },
        ]
      : [];

    const isPracticeDay = viewDate.getMonth() === 3 && practiceClassDays.includes(selectedDay);
    const practiceEvent = isPracticeDay
      ? [
          {
            type: "practice" as const,
            label: "Lớp luyện đề tập trung",
            detail: "19h45 - 21h30 · Sửa đề và chữa bài",
          },
        ]
      : [];

    return [...courseEvent, ...practiceEvent, ...approvedEvents];
  }, [approvedTests, selectedDay, viewDate]);

  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Thông tin khóa học</h2>
          <p className="text-muted text-sm mt-1 font-medium">Thông tin lớp học, RLP và lịch học chính khóa của bạn.</p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          
          <div className="lg:col-span-8 flex flex-col gap-10">
            <Panel title="Tổng quan khoá học">
              <CourseOverviewSection />
            </Panel>

            <Panel title="Hỗ trợ tự học" className="flex-1">
              <div className="rounded-2xl border border-primary/25 bg-primary-soft/20 p-5">
                <p className="text-sm font-semibold text-zinc-800">
                  Các mục đăng ký Mock Test, chấm chữa Writing và lớp luyện đề đã được chuyển sang tab mới.
                </p>
                <p className="mt-2 text-xs text-zinc-600">
                  Vào tab <strong>Hỗ trợ tự học</strong> để thao tác đăng ký và theo dõi lịch tự học.
                </p>
                <Link
                  href="/ho-tro-tu-hoc"
                  className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-primary/90"
                >
                  Mở tab hỗ trợ tự học
                </Link>
              </div>
            </Panel>

          </div>

          <div className="lg:col-span-4 flex flex-col">
            <Panel title="Thời khoá biểu" className="flex-1">
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
                    const isToday = isSameCalendarDay(
                      clientToday,
                      day,
                      viewDate.getMonth(),
                      viewDate.getFullYear(),
                    );
                    const isCourseDay = viewDate.getMonth() === 3 && [21, 23, 25, 28, 30].includes(day);
                    const isPracticeDay = viewDate.getMonth() === 3 && practiceClassDays.includes(day);

                    const isHighlighted = isCourseDay || isPracticeDay || isApprovedMock || isToday;
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
                          isSelected
                            ? "ring-2 ring-primary/35"
                            : ""
                        } ${
                          isToday
                            ? 'bg-primary text-white shadow-premium scale-110 z-10'
                            : isCourseDay || isPracticeDay
                              ? 'bg-primary-soft text-primary shadow-sm'
                              : isApprovedMock
                                ? 'bg-secondary-soft text-secondary shadow-sm'
                                : 'text-foreground/50'
                        } ${isHighlighted ? "cursor-pointer" : "cursor-default"}`}
                      >
                        {day}
                        {isApprovedMock && !isToday && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-secondary rounded-full ring-2 ring-white"></div>}
                        {(isCourseDay || isPracticeDay) && !isToday && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>}
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

          <div className="lg:col-span-12 scroll-mt-24" id="rlp-section">
            <Panel title="RLP - Resonant Lesson Plan">
              <div className="space-y-4">
                {importantLinks.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-2xl border border-primary/15 bg-white p-5 shadow-soft"
                  >
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {link.label}
                    </div>
                    <div className="mt-2 text-sm font-bold text-foreground break-words">
                      {link.value}
                    </div>
                    {link.id !== "rlp" ? (
                      <button className="mt-4 rounded-lg bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/90 transition-all">
                        Truy cập
                      </button>
                    ) : null}
                    {link.id === "rlp" ? (
                      <div className="mt-4 rounded-xl border border-primary/10 bg-background/40 p-3">
                        <div className="overflow-x-auto">
                          <table className="min-w-[980px] w-full border-separate border-spacing-0">
                            <thead>
                              <tr className="text-left">
                                {["SKILL", "NỘI DUNG", "NGÀY", "TIẾN ĐỘ LỚP HỌC", "FILE BÀI HỌC", "HOMEWORK"].map((h) => (
                                  <th
                                    key={h}
                                    className="sticky top-0 z-10 bg-background px-3 py-3 text-[10px] font-black uppercase tracking-widest text-muted border-b border-primary/10"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sessions.map((row) => (
                                <tr key={row.no} className="align-top hover:bg-white/80 transition-colors">
                                  <td className="px-3 py-3 border-b border-primary/10 whitespace-nowrap">
                                    <span
                                      className={[
                                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                                        row.skill === "Speaking"
                                          ? "bg-primary/10 text-primary"
                                          : "bg-info/10 text-info",
                                      ].join(" ")}
                                    >
                                      {row.skill}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-[12px] font-medium text-foreground border-b border-primary/10 min-w-[340px]">
                                    {row.contents}
                                  </td>
                                  <td className="px-3 py-3 text-[11px] font-semibold text-muted border-b border-primary/10 whitespace-nowrap">
                                    {row.date}
                                  </td>
                                  <td className="px-3 py-3 text-[12px] font-medium text-muted border-b border-primary/10 min-w-[260px]">
                                    {row.teacherNote}
                                  </td>
                                  <td className="px-3 py-3 border-b border-primary/10 whitespace-nowrap">
                                    <button className="text-primary hover:text-primary-dark transition-colors">
                                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    </button>
                                  </td>
                                  <td className="px-3 py-3 border-b border-primary/10 whitespace-nowrap">
                                    <button className="text-secondary hover:text-secondary-dark transition-colors">
                                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
