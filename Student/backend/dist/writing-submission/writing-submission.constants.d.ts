export declare const WRITING_SUBMISSION_STATUSES: readonly ["pending", "grading", "graded"];
export type WritingSubmissionStatus = (typeof WRITING_SUBMISSION_STATUSES)[number];
export declare function isWritingSubmissionStatus(value: string): value is WritingSubmissionStatus;
