"use client";

import { Panel } from "@/components/student/ui";
import { findSessionsOnDay } from "@/lib/courseSchedule";
import { isSameCalendarDay } from "@/hooks/useClientToday";
import type { StudentSchedule } from "@/hooks/useStudentSchedule";
import { deduplicateMockTestRequests } from "@/lib/mockTestRequests";
import { StudentDialog } from "@/components/student/StudentDialog";

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
      <Panel
        title={title}
        className="h-full"
        right="Chọn ngày highlight để xem sự kiện"
      >
        <div className="space-y-3">

          <div className="flex items-center justify-between rounded-2xl bg-background p-2.5 shadow-inner">
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

          <div className="mb-2 grid grid-cols-7 gap-1.5">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-muted">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
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
                      ? "z-10 scale-110 bg-sky-600 text-white font-black shadow-premium ring-2 ring-sky-300"
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

          <div className="mb-2 space-y-1.5 text-[9px] font-semibold text-muted">
            {/* Hàng 1 */}
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 min-w-[125px]">
                <span className="h-2.5 w-2.5 rounded bg-sky-600 ring-1 ring-sky-700/30" />
                Hôm nay (Hiện tại)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-primary-soft ring-1 ring-primary/20" />
                Buổi sắp tới
              </span>
            </div>

            {/* Hàng 2 */}
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 min-w-[125px]">
                <span className="h-2.5 w-2.5 rounded bg-emerald-100 ring-1 ring-emerald-300" />
                Đã đi học
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-danger/15 ring-1 ring-danger/25" />
                Vắng học
              </span>
            </div>

            {/* Hàng 3 */}
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 min-w-[125px]">
                <span className="h-2.5 w-2.5 rounded bg-info/15 ring-1 ring-info/25" />
                Lớp luyện đề
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-info/15 ring-1 ring-info/25" />
                Mock test đã duyệt
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Pop-up modal when a highlighted date is clicked */}
      <StudentDialog
        open={selectedDay !== null}
        title={selectedDay ? `Chi tiết sự kiện — Ngày ${selectedDay} ${months[month]} ${year}` : "Sự kiện"}
        tone="info"
        onClose={() => setSelectedDay(null)}
      >
        <div className="space-y-3">
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((event, idx) => (
              <div key={`${event.type}-${idx}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-2">
                <div className="text-xs font-black text-foreground">{event.label}</div>
                <div className="text-xs font-semibold text-muted leading-relaxed">{event.detail}</div>
                {(event as any).meetLink ? (
                  <div className="pt-1.5 space-y-1.5 border-t border-zinc-200/70 mt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {(event as any).meetingId ? (
                        <div className="text-[11px] font-mono font-bold text-zinc-700">
                          ID: {(event as any).meetingId} · Pass: {(event as any).password}
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-emerald-800">
                          Link phòng thi Speaking 1:1
                        </div>
                      )}
                      <a
                        href={(event as any).meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-black text-white hover:bg-emerald-800 transition-all shadow-2xs"
                      >
                        Vào lớp học ngay ↗
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-zinc-50 p-4 text-center text-xs font-semibold text-muted">
              Không có sự kiện nào trong ngày này.
            </div>
          )}
        </div>
      </StudentDialog>
    </div>
  );
}
