import type { Attendance, HomeworkStatus } from '../rlp.types';

export class UpdateRlpSessionDto {
  attendance?: Attendance;
  studentAttendance?: Record<string, Attendance>;
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
