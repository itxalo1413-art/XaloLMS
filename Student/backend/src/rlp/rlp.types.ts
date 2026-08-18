export type HomeworkStatus =
  | 'submitted'
  | 'submitted_waiting'
  | 'in_progress'
  | 'overdue'
  | 'not_assigned';

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
  /** Điểm danh từng học viên trong lớp (studentId → present/absent). */
  studentAttendance?: Record<string, Attendance>;
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  recordingUrl?: string;
};
