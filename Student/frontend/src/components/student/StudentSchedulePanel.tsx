"use client";

import { Panel } from "@/components/student/ui";
import { findSessionsOnDay } from "@/lib/courseSchedule";
import { isSameCalendarDay } from "@/hooks/useClientToday";
import type { StudentSchedule } from "@/hooks/useStudentSchedule";

type Props = {
  schedule: StudentSchedule;
  title?: string;
  className?: string;
  sectionId?: string;
};

export function StudentSchedulePanel({
  schedule,
  title = "Thời khoá biểu",
  className = "flex-1",
  sectionId = "schedule-section",
}: Props) {
  const {
    clientToday,
    viewDate,
    month,
    year,
    selectedDay,
    setSelectedDay,
    changeMonth,
    daysInMonth,
    prevMonthPadding,
    selectedDayEvents,
    approvedTests,
    pendingTests,
    months,
    getSessionsDayStyle,
    hasRegisteredPracticeOnDay,
  } = schedule;

  return (
    <div className={`flex flex-col scroll-mt-24 ${className}`} id={sectionId}>
      <Panel title={title} className="h-full">
        <div className="space-y-8">
          <div className="flex items-center justify-between rounded-2xl bg-background p-4 shadow-inner">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-muted shadow-sm transition-all hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
              {months[month]} {year}
            </h3>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-muted shadow-sm transition-all hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mb-4 grid grid-cols-7 gap-2">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-muted">
                {day}
              </div>
            ))}
          </div>

          

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: prevMonthPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const sessionsOnDay = findSessionsOnDay(day, month, year);
              const isApprovedMock = approvedTests.some(
                (t) => t.day === day && t.month === month && t.year === year,
              );
              const isToday = isSameCalendarDay(clientToday, day, month, year);
              const isPracticeDay = hasRegisteredPracticeOnDay(day, month, year);

              const isHighlighted =
                sessionsOnDay.length > 0 || isPracticeDay || isApprovedMock || isToday;
              const isSelected = selectedDay === day;
              const sessionStyle = getSessionsDayStyle(sessionsOnDay);

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => {
                    if (!isHighlighted) return;
                    setSelectedDay(selectedDay === day ? null : day);
                  }}
                  className={`relative flex h-8 w-full items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                    isSelected ? "ring-2 ring-primary/35" : ""
                  } ${
                    isToday
                      ? "z-10 scale-110 bg-primary text-white shadow-premium"
                      : sessionsOnDay.length > 0
                        ? sessionStyle
                        : isPracticeDay || isApprovedMock
                          ? "bg-info/15 text-info shadow-sm ring-1 ring-info/20"
                          : "text-foreground/50"
                  } ${isHighlighted ? "cursor-pointer" : "cursor-default"}`}
                >
                  {day}
                  {(isApprovedMock || isPracticeDay) &&
                    !isToday &&
                    sessionsOnDay.length === 0 && (
                    <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-info ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mb-3 flex flex-wrap gap-3 text-[10px] font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-primary-soft ring-1 ring-primary/20" />
              Buổi sắp tới
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-success/20 ring-1 ring-success/30" />
              Đã đi học
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-danger/15 ring-1 ring-danger/25" />
              Vắng học
            </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-info/15 ring-1 ring-info/25" />
            Lớp luyện đề (đã đăng ký)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-info/15 ring-1 ring-info/25" />
            Mock test đã duyệt (đã đăng ký)
          </span>
          </div>
          <div className="space-y-6 border-t border-background pt-6">
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Sự kiện & Nhắc hẹn
            </h4>
            <div className="rounded-xl border border-primary/10 bg-background/60 p-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                {selectedDay
                  ? `Sự kiện ngày ${selectedDay} ${months[month]}`
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
                    <div className="text-[11px] text-muted">Không có sự kiện trong ngày này.</div>
                  )
                ) : null}
              </div>
            </div>
            <div className="space-y-4">
              {approvedTests
                .filter((t) => t.month === month && t.year === year)
                .map((test) => (
                  <div
                    key={test.id}
                    className="group flex items-center gap-4 rounded-2xl bg-background p-4 transition-all hover:bg-white hover:shadow-soft"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-secondary shadow-sm transition-all group-hover:bg-secondary group-hover:text-white">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-black text-foreground">{test.skill}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase text-muted">
                        Ngày {test.day} {months[test.month]} {test.year}
                      </div>
                      <div className="mt-0.5 text-[10px] font-semibold text-secondary">
                        Giờ {test.examTime ?? "—"} · {test.examTeacher ?? "GV —"}
                      </div>
                    </div>
                  </div>
                ))}
              {approvedTests.filter((t) => t.month === month && t.year === year).length === 0 &&
                pendingTests.filter((t) => t.month === month && t.year === year).length === 0 && (
                  <div className="rounded-xl bg-background/50 p-4 text-center text-[10px] italic text-muted">
                    Không có mock test đã duyệt trong tháng này. Yêu cầu đang chờ sẽ không hiện trên lịch.
                  </div>
                )}
              {approvedTests.filter((t) => t.month === month && t.year === year).length === 0 &&
                pendingTests.filter((t) => t.month === month && t.year === year).length > 0 && (
                  <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-[10px] font-medium text-warning">
                    Bạn có ca chờ duyệt trong tháng này — chưa hiển thị trên lịch.
                  </div>
                )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
