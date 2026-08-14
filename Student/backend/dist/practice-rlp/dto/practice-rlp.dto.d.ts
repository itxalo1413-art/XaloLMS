import type { Attendance, HomeworkStatus } from '../../rlp/rlp.types';
export declare class UpdatePracticeRlpSessionDto {
    attendance?: Attendance;
    homeworkStatus?: HomeworkStatus;
    teacherNote?: string;
    lessonFileUrl?: string;
    homeworkFileUrl?: string;
    recordingUrl?: string;
    contents?: string;
    date?: string;
    deadline?: string;
    skill?: string;
}
export declare class CreatePracticeRlpSessionDto {
    no: number;
    date: string;
    skill: string;
    contents: string;
    teacherNote?: string;
    deadline?: string;
    homeworkStatus?: HomeworkStatus;
    attendance?: Attendance;
    lessonFileUrl?: string;
    homeworkFileUrl?: string;
    recordingUrl?: string;
}
