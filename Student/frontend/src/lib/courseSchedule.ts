import type { ClientToday } from "@/hooks/useClientToday";

export type HomeworkStatus = "submitted" | "in_progress" | "overdue" | "not_assigned";
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
};

export const SCHEDULE_MONTH_LABELS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
] as const;

export const PRACTICE_CLASS_DAYS = [3, 10, 17, 24] as const;

export const HOMEWORK_STATUS_LABEL: Record<HomeworkStatus, string> = {
  submitted: "Đã nộp",
  in_progress: "Đang làm",
  overdue: "Quá hạn",
  not_assigned: "Chưa giao",
};

export const HOMEWORK_STATUS_CLASS: Record<HomeworkStatus, string> = {
  submitted: "bg-success/10 text-success",
  in_progress: "bg-primary/10 text-primary",
  overdue: "bg-danger/10 text-danger",
  not_assigned: "bg-zinc-100 text-muted",
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

export const COURSE_RLP_SESSIONS: RlpSession[] = [
  {
    no: 1,
    date: "02/10/2025",
    skill: "Speaking",
    contents:
      "Introduction to Speaking Part 1 - chiến thuật trả lời chủ đề Work, Hobbies, Travel",
    teacherNote: "Đã nắm được đủ cấu trúc trả lời Part 1, mở rộng ví linh hoạt được.",
    deadline: "09/10/2025",
    homeworkStatus: "submitted",
    attendance: "present",
  },
  {
    no: 2,
    date: "04/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Descriptive language, Describe a person",
    teacherNote: "Hiểu yêu cầu Part 2, thiếu từ vựng cụ thể, cần luyện thêm chèn story.",
    deadline: "11/10/2025",
    homeworkStatus: "submitted",
    attendance: "present",
  },
  {
    no: 3,
    date: "09/10/2025",
    skill: "Reading",
    contents: "Reading - Matching headings, Sentence endings",
    teacherNote: "Nắm cách định vị đáp án Completion, làm được từ khóa T/F/NG.",
    deadline: "16/10/2025",
    homeworkStatus: "overdue",
    attendance: "present",
  },
  {
    no: 4,
    date: "11/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Describe an item, phát âm & giọng cuối câu",
    teacherNote: "Cần chú ý hạ giọng khi phát âm, đã biết ở cuối câu hay cụm từ.",
    deadline: "18/10/2025",
    homeworkStatus: "in_progress",
    attendance: "absent",
  },
  {
    no: 5,
    date: "16/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 3 - Chiến thuật câu hỏi, phát triển ý",
    teacherNote: "Nắm được cách kéo dài để suy nghĩ idea cho Part 3.",
    deadline: "23/10/2025",
    homeworkStatus: "submitted",
    attendance: "present",
  },
  {
    no: 6,
    date: "18/10/2025",
    skill: "Reading",
    contents: "Reading - Matching features, Matching information",
    teacherNote: "Hiểu cách đọc dày để áp dụng vào bài Matching headings.",
    deadline: "25/10/2025",
    homeworkStatus: "submitted",
    attendance: "present",
  },
  {
    no: 7,
    date: "18/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Describe a place, cleft sentence",
    teacherNote: "Hiểu ứng dụng cleft sentence, cần luyện thêm để thành nhuần nhuyễn.",
    deadline: "25/10/2025",
    homeworkStatus: "not_assigned",
    attendance: "absent",
  },
  {
    no: 8,
    date: "21/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 & 3 liên tục, tạo ngữ cơ bản, nguyên âm đôi",
    teacherNote: "Nắm mẫu câu tạo ngữ căn bản, cần luyện phát âm nguyên âm đôi.",
    deadline: "28/10/2025",
    homeworkStatus: "submitted",
    attendance: "present",
  },
  {
    no: 9,
    date: "23/10/2025",
    skill: "Reading",
    contents: "Reading - Multiple choice (Passage 2)",
    teacherNote: "Xử lý tốt dạng multiple choice đoạn học thuật.",
    deadline: "30/10/2025",
    homeworkStatus: "in_progress",
    attendance: "present",
  },
  {
    no: 10,
    date: "25/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 1 - Accommodation, Sport, Transportation",
    teacherNote: "Diễn đạt hẹp hơn, nắm thành phần câu cơ bản.",
    deadline: "01/11/2025",
    homeworkStatus: "submitted",
    attendance: "present",
  },
  {
    no: 11,
    date: "28/10/2025",
    skill: "Speaking",
    contents: "Speaking Part 2 - Story telling, Describe an experience",
    teacherNote: "Luyện cụm động từ danh từ, đa phần hình thành cụm danh từ cơ bản.",
    deadline: "04/11/2025",
    homeworkStatus: "overdue",
    attendance: "present",
  },
  {
    no: 12,
    date: "30/10/2025",
    skill: "Reading",
    contents: "Reading - Information Identification (T/F/NG, Y/N/NG)",
    teacherNote: "Nắm cách đọc lấy thông tin và so sánh với câu hỏi.",
    deadline: "06/11/2025",
    homeworkStatus: "submitted",
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

export function findSessionOnDay(day: number, month: number, year: number): RlpSession | undefined {
  return COURSE_RLP_SESSIONS.find((s) => {
    const p = parseSessionDate(s.date);
    return p && p.day === day && p.month === month && p.year === year;
  });
}

export function findSessionsOnDay(day: number, month: number, year: number): RlpSession[] {
  return COURSE_RLP_SESSIONS.filter((s) => {
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
  return "bg-success/15 text-success shadow-sm ring-1 ring-success/20";
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
