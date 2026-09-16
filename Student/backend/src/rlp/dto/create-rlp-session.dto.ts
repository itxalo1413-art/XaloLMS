import type { Attendance, HomeworkStatus } from '../rlp.types';

export class CreateRlpSessionDto {
  no?: number;
  date?: string;
  skill?: string;
  contents?: string;
  teacherNote?: string;
  deadline?: string;
  homeworkStatus?: HomeworkStatus;
  attendance?: Attendance;
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  recordingUrl?: string;
}
