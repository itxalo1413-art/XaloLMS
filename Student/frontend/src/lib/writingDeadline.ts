export const WRITING_GRADING_DEADLINE_DAYS = 5;

export function formatViDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function parseViDate(dateStr: string): Date | null {
  const m = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Hạn chấm Grader = ngày nộp + 5 ngày. */
export function computeWritingDueDateFromSubmitted(submittedAt?: string | Date): string {
  const base = submittedAt ? new Date(submittedAt) : new Date();
  if (Number.isNaN(base.getTime())) return formatViDate(new Date());
  const due = new Date(base);
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + WRITING_GRADING_DEADLINE_DAYS);
  return formatViDate(due);
}

export function resolveWritingDueDate(row: {
  submittedAt?: string;
  dueDate?: string;
}): string {
  const stored = row.dueDate?.trim();
  if (stored) return stored;
  if (!row.submittedAt) return "—";
  return computeWritingDueDateFromSubmitted(row.submittedAt);
}

export type WritingDeadlineStatus = {
  dueDate: string;
  isOverdue: boolean;
  daysRemaining: number;
  daysLate: number;
};

export function getWritingDeadlineStatus(row: {
  submittedAt?: string;
  dueDate?: string;
  status?: string;
  gradedAt?: string;
}): WritingDeadlineStatus {
  const dueDate = resolveWritingDueDate(row);
  const due = parseViDate(dueDate);
  if (!due) {
    return { dueDate, isOverdue: false, daysRemaining: 0, daysLate: 0 };
  }

  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (row.status === "graded") {
    const gradedAt = row.gradedAt ? new Date(row.gradedAt) : new Date();
    gradedAt.setHours(0, 0, 0, 0);
    const daysLate = Math.max(
      0,
      Math.floor((gradedAt.getTime() - dueDay.getTime()) / (1000 * 60 * 60 * 24)),
    );
    return {
      dueDate,
      isOverdue: daysLate > 0,
      daysRemaining: 0,
      daysLate,
    };
  }

  const daysRemaining = Math.floor(
    (dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysRemaining < 0;
  return {
    dueDate,
    isOverdue,
    daysRemaining: Math.max(0, daysRemaining),
    daysLate: isOverdue ? Math.abs(daysRemaining) : 0,
  };
}
