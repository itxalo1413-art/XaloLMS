import type { ClientToday } from "@/hooks/useClientToday";

export type HomeworkStatus = "submitted" | "submitted_waiting" | "in_progress" | "overdue" | "not_assigned";
export type Attendance = "present" | "absent";

export type RlpSession = {
  no: number;
  date: string;
  skill: string;
  contents: string;
  teacherNote: string;
  deadline: string;
  homeworkStatus: HomeworkStatus;
  attendance: Attendance;
  studentAttendance?: Record<string, Attendance>;
  /** Link Google Drive / tài liệu buổi học */
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  /** Link video Record buổi học */
  recordingUrl?: string;
};

export const SCHEDULE_MONTH_LABELS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
] as const;

export const PRACTICE_CLASS_DAYS = [3, 10, 17, 24] as const;

export const HOMEWORK_STATUS_LABEL: Record<HomeworkStatus, string> = {
  submitted: "Đã chấm",
  submitted_waiting: "Đã nộp",
  in_progress: "Chưa nộp",
  overdue: "Chưa nộp",
  not_assigned: "Chưa giao",
};

export const HOMEWORK_STATUS_TEXT_CLASS: Record<HomeworkStatus, string> = {
  submitted: "text-success",
  submitted_waiting: "text-primary",
  in_progress: "text-danger",
  overdue: "text-danger",
  not_assigned: "text-muted",
};

function parseSessionDate(dateStr: string): { day: number; month: number; year: number } | null {
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return { day: Number(m[1]), month: Number(m[2]) - 1, year: Number(m[3]) };
}

function sessionCalendarDate(session: RlpSession): Date | null {
  const p = parseSessionDate(session.date);
  if (!p) return null;
  return new Date(p.year, p.month, p.day);
}

export function parseSessionDateString(dateStr: string) {
  return parseSessionDate(dateStr);
}

export function calculateGradingDeadline(deadlineStr?: string): string {
  if (!deadlineStr || deadlineStr === "—" || !deadlineStr.trim()) return "—";
  const m = deadlineStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "—";
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + 10);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function isSessionPast(session: RlpSession, today: ClientToday | null): boolean {
  const d = sessionCalendarDate(session);
  if (!d || !today) return false;
  const sessionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayDay = new Date(today.year, today.month, today.date).getTime();
  return sessionDay < todayDay;
}

export function isSessionFuture(session: RlpSession, today: ClientToday | null): boolean {
  const d = sessionCalendarDate(session);
  if (!d || !today) return false;
  const sessionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayDay = new Date(today.year, today.month, today.date).getTime();
  return sessionDay > todayDay;
}

export const DEFAULT_COURSE_RLP_SESSIONS: RlpSession[] = [
  {
    no: 1,
    date: "02/10/2025",
    skill: "Speaking",
    contents:
      "Introduction to Speaking Part 1 - chiến thuật trả lời chủ đề Work, Hobbies, Travel",
    teacherNote: "—",
    deadline: "09/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://example.com/tailieu-part1.pdf",
  },
  {
    no: 2,
    date: "04/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Descriptive language, Describe a person",
    teacherNote: "—",
    deadline: "11/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://example.com/bai-tap-describe-person.docx",
  },
  {
    no: 3,
    date: "09/10/2025",
    skill: "Reading",
    contents: "Reading - Matching headings, Sentence endings",
    teacherNote: "—",
    deadline: "16/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://example.com/slides-headings.pptx",
  },
  {
    no: 4,
    date: "11/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Describe an item, phát âm & giọng cuối câu",
    teacherNote: "—",
    deadline: "18/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://example.com/bang-diem-danh-phat-am.xlsx",
  },
  {
    no: 5,
    date: "16/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 3 - Chiến thuật câu hỏi, phát triển ý",
    teacherNote: "—",
    deadline: "23/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://xalo.edu.vn",
  },
  {
    no: 6,
    date: "18/10/2025",
    skill: "Reading",
    contents: "Reading - Matching features, Matching information",
    teacherNote: "—",
    deadline: "25/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 7,
    date: "18/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Describe a place, cleft sentence",
    teacherNote: "—",
    deadline: "25/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 8,
    date: "21/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 & 3 liên tục, tạo ngữ cơ bản, nguyên âm đôi",
    teacherNote: "—",
    deadline: "28/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 9,
    date: "23/10/2025",
    skill: "Reading",
    contents: "Reading - Multiple choice (Passage 2)",
    teacherNote: "—",
    deadline: "30/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 10,
    date: "25/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 1 - Accommodation, Sport, Transportation",
    teacherNote: "—",
    deadline: "01/11/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 11,
    date: "28/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Story telling, Describe an experience",
    teacherNote: "—",
    deadline: "04/11/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 12,
    date: "30/10/2025",
    skill: "Reading",
    contents: "Reading - Information Identification (T/F/NG, Y/N/NG)",
    teacherNote: "—",
    deadline: "06/11/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 13,
    date: "21/04/2026",
    skill: "Writing",
    contents: "Writing Task 1 - Biểu đồ cột, cấu trúc overview & body",
    teacherNote: "—",
    deadline: "28/04/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 14,
    date: "23/04/2026",
    skill: "Listening",
    contents: "Listening Section 1-2 - Form completion, map labelling",
    teacherNote: "—",
    deadline: "30/04/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 15,
    date: "25/04/2026",
    skill: "Speaking",
    contents: "Speaking Part 2 - Describe an event (Chặng 1)",
    teacherNote: "—",
    deadline: "02/05/2026",
    homeworkStatus: "in_progress",
    attendance: "present",
  },
  {
    no: 16,
    date: "28/04/2026",
    skill: "Reading",
    contents: "Reading - Summary completion, flow-chart",
    teacherNote: "—",
    deadline: "05/05/2026",
    homeworkStatus: "not_assigned",
    attendance: "absent",
  },
  {
    no: 17,
    date: "30/04/2026",
    skill: "Writing",
    contents: "Writing Task 2 - Opinion essay outline",
    teacherNote: "—",
    deadline: "07/05/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 18,
    date: "05/05/2026",
    skill: "Listening",
    contents: "Listening Section 3-4 - Academic discussion",
    teacherNote: "—",
    deadline: "12/05/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 19,
    date: "25/05/2026",
    skill: "Speaking",
    contents: "Speaking mock round - Full test simulation",
    teacherNote: "—",
    deadline: "26/05/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
  {
    no: 20,
    date: "27/05/2026",
    skill: "Reading",
    contents: "Reading intensive - Mixed question types review",
    teacherNote: "—",
    deadline: "30/05/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
  },
];

/** @deprecated Use getCourseRlpSessions() from rlpSessionStore */
export const COURSE_RLP_SESSIONS = DEFAULT_COURSE_RLP_SESSIONS;

let activeRlpSessions: RlpSession[] = DEFAULT_COURSE_RLP_SESSIONS;

export function setActiveRlpSessions(sessions: RlpSession[]) {
  activeRlpSessions = sessions.length > 0 ? sessions : DEFAULT_COURSE_RLP_SESSIONS;
}

export function getActiveRlpSessions(): RlpSession[] {
  return activeRlpSessions;
}

export function findSessionOnDay(day: number, month: number, year: number): RlpSession | undefined {
  return activeRlpSessions.find((s) => {
    const p = parseSessionDate(s.date);
    return p && p.day === day && p.month === month && p.year === year;
  });
}

export function findSessionsOnDay(day: number, month: number, year: number): RlpSession[] {
  return activeRlpSessions.filter((s) => {
    const p = parseSessionDate(s.date);
    return p && p.day === day && p.month === month && p.year === year;
  });
}

export function getSessionsDayStyle(
  daySessions: RlpSession[],
  clientToday: ClientToday | null,
): string {
  if (daySessions.length === 0) return "";
  if (!clientToday) return "bg-primary-soft text-primary shadow-sm";
  if (daySessions.every((s) => isSessionFuture(s, clientToday))) {
    return "bg-primary-soft text-primary shadow-sm";
  }
  const anyAbsent = daySessions.some(
    (s) => s.attendance === "absent" && !isSessionFuture(s, clientToday),
  );
  if (anyAbsent) return "bg-danger/15 text-danger shadow-sm ring-1 ring-danger/20";
  return "bg-emerald-100 text-emerald-800 font-bold shadow-sm ring-1 ring-emerald-300/80";
}

export function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

export function getPrevMonthPadding(month: number, year: number) {
  const firstDay = getFirstDayOfMonth(month, year);
  return (firstDay + 6) % 7;
}
