export const WRITING_SUBMISSION_STATUSES = [
  'pending',
  'grading',
  'graded',
] as const;

export type WritingSubmissionStatus =
  (typeof WRITING_SUBMISSION_STATUSES)[number];

export function isWritingSubmissionStatus(
  value: string,
): value is WritingSubmissionStatus {
  return (WRITING_SUBMISSION_STATUSES as readonly string[]).includes(value);
}
