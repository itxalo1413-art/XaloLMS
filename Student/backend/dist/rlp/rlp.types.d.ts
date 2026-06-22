export type HomeworkStatus = 'submitted' | 'in_progress' | 'overdue' | 'not_assigned';
export type Attendance = 'present' | 'absent';
export type RlpSessionRecord = {
    no: number;
    date: string;
    skill: string;
    contents: string;
    teacherNote: string;
    deadline: string;
    homeworkStatus: HomeworkStatus;
    attendance: Attendance;
    lessonFileUrl?: string;
};
