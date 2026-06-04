import type { Attendance, HomeworkStatus } from '../rlp.types';

export class UpdateRlpSessionDto {
  attendance?: Attendance;
  homeworkStatus?: HomeworkStatus;
  teacherNote?: string;
  lessonFileUrl?: string;
}
