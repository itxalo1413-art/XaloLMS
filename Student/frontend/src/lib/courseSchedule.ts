import type { ClientToday } from "@/hooks/useClientToday";

export type HomeworkStatus = "submitted" | "submitted_waiting" | "in_progress" | "overdue" | "not_assigned";
export type Attendance = "present" | "absent";

export type RlpSession = {
  no: number;
  date: string;
  skill: string;
  contents: string;
  /** Giáo viên phụ trách buổi (Responsible Teacher). */
  responsibleTeacher?: string;
  teacherNote: string;
  deadline: string;
  homeworkStatus: HomeworkStatus;
  attendance: Attendance;
  studentAttendance?: Record<string, Attendance>;
  /** Trạng thái BTVN từng học viên */
  studentHomework?: Record<string, HomeworkStatus>;
  /** Link Google Drive / tài liệu buổi học */
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  /** Link video Record buổi học */
  recordingUrl?: string;
};

export const SCHEDULE_MONTH_LABELS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
] as const;

export const PRACTICE_CLASS_DAYS = [3, 10, 17, 24] as const;

export const HOMEWORK_STATUS_LABEL: Record<HomeworkStatus, string> = {
  submitted: "Đã chấm",
  submitted_waiting: "Đã nộp",
  in_progress: "Chưa nộp",
  overdue: "Chưa nộp",
  not_assigned: "Chưa giao",
};

export const HOMEWORK_STATUS_TEXT_CLASS: Record<HomeworkStatus, string> = {
  submitted: "text-success",
  submitted_waiting: "text-primary",
  in_progress: "text-danger",
  overdue: "text-danger",
  not_assigned: "text-muted",
};

export function isHomeworkSubmittedStatus(status?: HomeworkStatus): boolean {
  return status === "submitted" || status === "submitted_waiting";
}

export function resolveStudentHomeworkStatus(
  session: RlpSession,
  studentId?: string,
): HomeworkStatus {
  if (studentId && session.studentHomework?.[studentId]) {
    return session.studentHomework[studentId];
  }
  if (!session.homeworkStatus || session.homeworkStatus === "not_assigned") {
    return "not_assigned";
  }
  return "in_progress";
}

function parseSessionDate(dateStr: string): { day: number; month: number; year: number } | null {
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return { day: Number(m[1]), month: Number(m[2]) - 1, year: Number(m[3]) };
}

function sessionCalendarDate(session: RlpSession): Date | null {
  const p = parseSessionDate(session.date);
  if (!p) return null;
  return new Date(p.year, p.month, p.day);
}

export function parseSessionDateString(dateStr: string) {
  return parseSessionDate(dateStr);
}

export function calculateGradingDeadline(deadlineStr?: string): string {
  if (!deadlineStr || deadlineStr === "—" || !deadlineStr.trim()) return "—";
  const m = deadlineStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "—";
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + 10);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function isSessionPast(session: RlpSession, today: ClientToday | null): boolean {
  const d = sessionCalendarDate(session);
  if (!d || !today) return false;
  const sessionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayDay = new Date(today.year, today.month, today.date).getTime();
  return sessionDay < todayDay;
}

export function isSessionFuture(session: RlpSession, today: ClientToday | null): boolean {
  const d = sessionCalendarDate(session);
  if (!d || !today) return false;
  const sessionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayDay = new Date(today.year, today.month, today.date).getTime();
  return sessionDay > todayDay;
}

export const DEFAULT_COURSE_RLP_SESSIONS: RlpSession[] = [
  // ── CHẶNG 1: WRITING & LISTENING (Buổi 1 - 18) ──
  // Thời gian: 20/12/2025 - 31/01/2026 (Thứ 3, Thứ 5, Thứ 7: 18h00 - 19h45)
  {
    no: 1,
    date: "20/12/2025",
    skill: "Writing",
    contents:
      "Introduction to Writing IELTS Task 1 & Structure/Grammar in WT1: Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng thuộc dạng bài; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "WRITING & LISTENING FOUNDATIONS: Nắm vững cấu trúc 4 đoạn chuẩn WT1.",
    deadline: "27/12/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s1-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s1-hw",
  },
  {
    no: 2,
    date: "23/12/2025",
    skill: "Writing",
    contents:
      "Introduction to Writing IELTS Task 2 & Argument essay: Hiểu loại đề và yêu cầu đề; Phân tích đề; Chiến lược viết Introduction; Luyện tập viết Introduction.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Chiến lược paraphrase đề bài và viết Thesis Statement rõ ràng.",
    deadline: "30/12/2025",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s2-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s2-hw",
  },
  {
    no: 3,
    date: "25/12/2025",
    skill: "Listening",
    contents:
      "Introduction to Listening IELTS & Listening Completion: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Rèn kỹ năng gạch chân từ khóa trong 30 giây chuẩn bị.",
    deadline: "01/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s3-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s3-hw",
  },
  {
    no: 4,
    date: "27/12/2025",
    skill: "Writing",
    contents:
      "Introduction to Line Graph and Bar Chart: Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng thuộc dạng bài; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Ngôn ngữ biến thiên xu hướng thời gian (trend & rate of change).",
    deadline: "03/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s4-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s4-hw",
  },
  {
    no: 5,
    date: "30/12/2025",
    skill: "Writing",
    contents:
      "Argument essay: Hiểu yêu cầu đề và phân tích đề; Sử dụng discourse marker (linking words); Chiến lược viết Supporting paragraph; Luyện tập viết Supporting paragraph.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Cấu trúc PEEL (Point - Explanation - Example - Link) cho thân bài luận.",
    deadline: "06/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s5-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s5-hw",
  },
  {
    no: 6,
    date: "03/01/2026",
    skill: "Listening",
    contents:
      "Introduction to Multiple choice: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật; Sửa và lưu ý cách giải quyết cho các vấn đề liên quan đến dạng Completion.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Kỹ năng loại trừ bẫy đáp án và nhận diện paraphrasing.",
    deadline: "10/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s6-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s6-hw",
  },
  {
    no: 7,
    date: "06/01/2026",
    skill: "Writing",
    contents:
      "Introduction to Table and Pie Chart: Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng thuộc dạng bài; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Ngôn ngữ so sánh hơn, so sánh nhất, tỉ lệ phần trăm.",
    deadline: "13/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s7-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s7-hw",
  },
  {
    no: 8,
    date: "08/01/2026",
    skill: "Writing",
    contents:
      "Argument essay: Hiểu yêu cầu đề và phân tích đề; Chiến lược viết Conclusion; Chiến lược đảm bảo Coherence và Cohesion; Luyện tập viết Conclusion và tổ chức bài.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Đảm bảo tính nhất quán giữa Introduction và Conclusion.",
    deadline: "15/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s8-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s8-hw",
  },
  {
    no: 9,
    date: "10/01/2026",
    skill: "Listening",
    contents:
      "Introduction to List selection: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Chiến thuật chọn 2 trong 5 đáp án; bắt bẫy chuyển ý.",
    deadline: "17/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s9-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s9-hw",
  },
  {
    no: 10,
    date: "13/01/2026",
    skill: "Writing",
    contents:
      "Introduction to Process (Natural Process & Man-made Process): Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng thuộc dạng bài; Phân tích biểu đồ, lựa chọn và sắp xếp thông tin; Luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "WRITING & LISTENING EXPANSION: Thể bị động và từ chỉ trình tự.",
    deadline: "20/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s10-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s10-hw",
  },
  {
    no: 11,
    date: "15/01/2026",
    skill: "Writing",
    contents:
      "Introduction to Discuss essay: Hiểu loại đề và yêu cầu đề; Phân tích đề; Chiến lược viết Introduction; Luyện tập viết Introduction.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Phân biệt rõ Discussion Essay vs Argument Essay.",
    deadline: "22/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s11-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s11-hw",
  },
  {
    no: 12,
    date: "17/01/2026",
    skill: "Listening",
    contents:
      "Introduction to Labeling Plan, Map, Diagram: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Từ vựng chỉ phương hướng, vị trí trong sơ đồ.",
    deadline: "24/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s12-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s12-hw",
  },
  {
    no: 13,
    date: "20/01/2026",
    skill: "Writing",
    contents:
      "Introduction to Map (Compare 1 map with changes through time, Compare 2 maps with no changes through time): Hiểu và làm đúng yêu cầu đề; Học và sử dụng từ vựng biến đổi quy hoạch; Phân tích biểu đồ; Luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Từ vựng quy hoạch đô thị (demolish, construct, expand).",
    deadline: "27/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s13-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s13-hw",
  },
  {
    no: 14,
    date: "22/01/2026",
    skill: "Writing",
    contents:
      "Discussion essay: Hiểu yêu cầu đề và phân tích đề; Sử dụng discourse marker (linking words); Chiến lược viết Supporting paragraph; Luyện tập viết Supporting paragraph.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Cách phân tích cân bằng 2 mặt quan điểm.",
    deadline: "29/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s14-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s14-hw",
  },
  {
    no: 15,
    date: "24/01/2026",
    skill: "Listening",
    contents:
      "Introduction to Matching: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Kỹ năng theo dõi mạch hội thoại Section 3.",
    deadline: "31/01/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s15-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s15-hw",
  },
  {
    no: 16,
    date: "27/01/2026",
    skill: "Writing",
    contents:
      "Discussion essay: Hiểu yêu cầu đề và phân tích đề; Chiến lược viết Conclusion; Chiến lược đảm bảo Coherence và Cohesion; Luyện tập viết Conclusion và tổ chức bài.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Tối ưu hóa điểm Lexical Resource và Cohesive Devices.",
    deadline: "03/02/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s16-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s16-hw",
  },
  {
    no: 17,
    date: "29/01/2026",
    skill: "Writing",
    contents:
      "Ôn tập và kiểm tra Writing: Ôn tập các kiến thức và chiến thuật làm các dạng bài; Kiểm tra với mock test Task 1 & 2 và sửa bài; Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Bấm giờ thi thử Task 1 (20p) + Task 2 (40p).",
    deadline: "05/02/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s17-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s17-hw",
  },
  {
    no: 18,
    date: "31/01/2026",
    skill: "Listening",
    contents:
      "Ôn tập và kiểm tra Listening: Ôn tập các kiến thức và chiến thuật làm các dạng bài; Kiểm tra với mock test và sửa bài; Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Đánh giá kết thúc Chặng 1 Writing & Listening.",
    deadline: "07/02/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s18-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s18-hw",
  },

  // ── CHẶNG 2: READING & SPEAKING (Buổi 19 - 36) ──
  // Thời gian: 24/02/2026 - 04/04/2026 (Thứ 3, Thứ 5, Thứ 7: 18h00 - 19h45)
  {
    no: 19,
    date: "24/02/2026",
    skill: "Speaking",
    contents:
      "Introduction to Speaking IELTS & Speaking Part 1: Hiểu tính chất của Part 1 và trả lời với độ dài phù hợp; Chiến thuật trả lời các câu hỏi trong Part 1 (Work-Study, Hometown, Hobbies, Travel-Holiday,...); Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "READING & SPEAKING FOUNDATIONS: Phản xạ trả lời 3-4 câu hoàn chỉnh.",
    deadline: "03/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s19-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s19-hw",
  },
  {
    no: 20,
    date: "26/02/2026",
    skill: "Speaking",
    contents:
      "Introduction to Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất miêu tả - Descriptive language trong Part 2 (Describe a person); Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Take notes 1 phút chuẩn bị và mở rộng cốt truyện.",
    deadline: "05/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s20-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s20-hw",
  },
  {
    no: 21,
    date: "28/02/2026",
    skill: "Reading",
    contents:
      "Introduction to Reading IELTS & Diagram label / Sentence Completion: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Kỹ năng Skimming & Scanning, xác định loại từ cần điền.",
    deadline: "07/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s21-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s21-hw",
  },
  {
    no: 22,
    date: "03/03/2026",
    skill: "Speaking",
    contents:
      "Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất miêu tả - Descriptive language trong Part 2 (Describe an item); Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Vận dụng tính từ miêu tả đồ vật và cảm nhận cá nhân.",
    deadline: "10/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s22-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s22-hw",
  },
  {
    no: 23,
    date: "05/03/2026",
    skill: "Speaking",
    contents:
      "Introduction to Speaking Part 3: Hiểu tính chất của Part 3 và trả lời với độ dài phù hợp; Chiến thuật trả lời các câu hỏi trong Part 3; Luyện tập và áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Mở rộng góc nhìn từ cá nhân sang xã hội.",
    deadline: "12/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s23-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s23-hw",
  },
  {
    no: 24,
    date: "07/03/2026",
    skill: "Reading",
    contents:
      "Introduction to Multiple choice: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Phân tích trắc nghiệm Passage 2, đối chiếu paraphrase.",
    deadline: "14/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s24-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s24-hw",
  },
  {
    no: 25,
    date: "10/03/2026",
    skill: "Speaking",
    contents:
      "Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất miêu tả - Descriptive language trong Part 2 (Describe a place); Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Miêu tả địa điểm, không gian; câu chẻ Cleft sentence.",
    deadline: "17/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s25-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s25-hw",
  },
  {
    no: 26,
    date: "12/03/2026",
    skill: "Speaking",
    contents:
      "Speaking Part 2 and Part 3: Chiến thuật trả lời liên tục Part 2 và Part 3; Luyện tập duy trì độ bền về ngôn ngữ, tư duy ý tưởng; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Mô phỏng áp lực thi Speaking liên tục, chỉnh ngắt nghỉ.",
    deadline: "19/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s26-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s26-hw",
  },
  {
    no: 27,
    date: "14/03/2026",
    skill: "Reading",
    contents:
      "Introduction to Information Identification (T/F/NG, Y/N/NG): Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Phân biệt False/No vs Not Given; bám sát text.",
    deadline: "21/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s27-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s27-hw",
  },
  {
    no: 28,
    date: "17/03/2026",
    skill: "Speaking",
    contents:
      "Speaking Part 1: Hiểu tính chất của Part 1 và trả lời với độ dài phù hợp; Chiến thuật trả lời các câu hỏi trong Part 1 (Accommodation, Sport-Exercise, Transportation,...); Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "READING & SPEAKING EXPANSION: Nâng cao vốn từ topic-specific.",
    deadline: "24/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s28-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s28-hw",
  },
  {
    no: 29,
    date: "19/03/2026",
    skill: "Speaking",
    contents:
      "Introduction to Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất kể chuyện - Story telling trong Part 2 (Describe an event); Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Kỹ thuật kể chuyện theo tuyến thời gian quá khứ.",
    deadline: "26/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s29-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s29-hw",
  },
  {
    no: 30,
    date: "21/03/2026",
    skill: "Reading",
    contents:
      "Introduction to Matching features và Matching information: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Chiến thuật quét tên riêng/thời gian và nối luận điểm.",
    deadline: "28/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s30-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s30-hw",
  },
  {
    no: 31,
    date: "24/03/2026",
    skill: "Speaking",
    contents:
      "Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất kể chuyện - Story telling trong Part 2 (Describe a situation); Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Tạo kịch tính và cảm xúc để câu chuyện thêm hấp dẫn.",
    deadline: "31/03/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s31-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s31-hw",
  },
  {
    no: 32,
    date: "26/03/2026",
    skill: "Speaking",
    contents:
      "Speaking Part 3: Hiểu tính chất của Part 3 và trả lời với độ dài phù hợp; Chiến thuật trả lời các câu hỏi trong Part 3; Luyện tập và áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Nâng cấp từ vựng học thuật C1/C2 và câu điều kiện.",
    deadline: "02/04/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s32-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s32-hw",
  },
  {
    no: 33,
    date: "28/03/2026",
    skill: "Reading",
    contents:
      "Introduction to Matching headings và Matching sentence endings: Hiểu và làm đúng yêu cầu đề; Chiến thuật làm bài; Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Kỹ thuật đọc câu chủ đề đoạn văn và tránh bẫy từ khóa.",
    deadline: "04/04/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s33-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s33-hw",
  },
  {
    no: 34,
    date: "31/03/2026",
    skill: "Speaking",
    contents:
      "Speaking Part 2: Hiểu tính chất của Part 2 và trả lời trong khung thời gian cho phép; Chiến thuật trả lời các câu hỏi mang tính chất kể chuyện - Story telling trong Part 2 (Describe an excursion); Luyện tập, áp dụng chiến thuật.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Luyện nói tự tin 2 phút trọn vẹn, kiểm soát tốt phát âm.",
    deadline: "07/04/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s34-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s34-hw",
  },
  {
    no: 35,
    date: "02/04/2026",
    skill: "Speaking",
    contents:
      "Ôn tập và kiểm tra Speaking: Ôn tập các kiến thức và chiến thuật full test; Kiểm tra với mock test và sửa bài; Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Mô phỏng thi Speaking hoàn chỉnh 15 phút với Examiner.",
    deadline: "09/04/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s35-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s35-hw",
  },
  {
    no: 36,
    date: "04/04/2026",
    skill: "Reading",
    contents:
      "Ôn tập và kiểm tra Reading: Ôn tập các kiến thức và chiến thuật làm các dạng bài; Kiểm tra với mock test và sửa bài; Lưu ý về các vấn đề phát sinh, định hướng tự luyện tập.",
    responsibleTeacher: "Lê Như Hải",
    teacherNote: "Final Mock Test kết thúc khóa Upstream - Đánh giá band score & Lập BCB.",
    deadline: "11/04/2026",
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "https://drive.google.com/file/d/upstream-s36-slides",
    homeworkFileUrl: "https://docs.google.com/document/d/upstream-s36-hw",
  },
];

/** @deprecated Use getCourseRlpSessions() from rlpSessionStore */
export const COURSE_RLP_SESSIONS = DEFAULT_COURSE_RLP_SESSIONS;

let activeRlpSessions: RlpSession[] = DEFAULT_COURSE_RLP_SESSIONS;

export function setActiveRlpSessions(sessions: RlpSession[]) {
  activeRlpSessions = sessions.length > 0 ? sessions : DEFAULT_COURSE_RLP_SESSIONS;
}

export function getActiveRlpSessions(): RlpSession[] {
  return activeRlpSessions;
}

export function findSessionOnDay(day: number, month: number, year: number): RlpSession | undefined {
  return activeRlpSessions.find((s) => {
    const p = parseSessionDate(s.date);
    return p && p.day === day && p.month === month && p.year === year;
  });
}

export function findSessionsOnDay(day: number, month: number, year: number): RlpSession[] {
  return activeRlpSessions.filter((s) => {
    const p = parseSessionDate(s.date);
    return p && p.day === day && p.month === month && p.year === year;
  });
}

export function getSessionsDayStyle(
  daySessions: RlpSession[],
  clientToday: ClientToday | null,
): string {
  if (daySessions.length === 0) return "";
  if (!clientToday) return "bg-primary-soft text-primary shadow-sm";
  if (daySessions.every((s) => isSessionFuture(s, clientToday))) {
    return "bg-primary-soft text-primary shadow-sm";
  }
  const anyAbsent = daySessions.some(
    (s) => s.attendance === "absent" && !isSessionFuture(s, clientToday),
  );
  if (anyAbsent) return "bg-danger/15 text-danger shadow-sm ring-1 ring-danger/20";
  return "bg-emerald-100 text-emerald-800 font-bold shadow-sm ring-1 ring-emerald-300/80";
}

export function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

export function getPrevMonthPadding(month: number, year: number) {
  const firstDay = getFirstDayOfMonth(month, year);
  return (firstDay + 6) % 7;
}
