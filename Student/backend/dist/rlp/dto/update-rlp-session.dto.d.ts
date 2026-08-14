import type { Attendance, HomeworkStatus } from '../rlp.types';
export declare class UpdateRlpSessionDto {
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
