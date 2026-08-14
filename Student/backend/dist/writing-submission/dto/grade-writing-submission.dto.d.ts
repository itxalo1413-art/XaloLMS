export declare class GradeWritingSubmissionDto {
    status?: 'pending' | 'grading' | 'graded';
    score?: string;
    examLink?: string;
    dueDate?: string;
    studentGmail?: string;
    type?: string;
    task1?: string;
    task2?: string;
    note?: string;
    assignedGrader?: string;
}
