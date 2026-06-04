import type { Attendance, HomeworkStatus } from '../rlp.types';
export declare class UpdateRlpSessionDto {
    attendance?: Attendance;
    homeworkStatus?: HomeworkStatus;
    teacherNote?: string;
}
