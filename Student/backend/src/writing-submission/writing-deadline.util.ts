export const WRITING_GRADING_DEADLINE_DAYS = 5;

export function formatWritingDueDateVi(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Hạn chấm = ngày nộp + 5 ngày (định dạng dd/MM/yyyy). */
export function computeWritingDueDateFromSubmitted(
  submittedAt?: Date | string | null,
): string {
  const base = submittedAt ? new Date(submittedAt) : new Date();
  if (Number.isNaN(base.getTime())) {
    return formatWritingDueDateVi(new Date());
  }
  const due = new Date(base);
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + WRITING_GRADING_DEADLINE_DAYS);
  return formatWritingDueDateVi(due);
}

export function resolveWritingDueDateStored(
  dueDate?: string,
  submittedAt?: Date | string | null,
): string {
  const trimmed = dueDate?.trim();
  if (trimmed) return trimmed;
  return computeWritingDueDateFromSubmitted(submittedAt);
}
