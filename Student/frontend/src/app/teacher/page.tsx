"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { NativeSelectChevron } from "@/components/student/ui";
import {
  fetchAcaClasses,
  fetchAca11Classes,
  fetchAcaStudents,
  updateAcaStudent,
  type AcaStudent,
  type AcaClass,
  type Aca11Class,
  type AcaStudentCycle,
  displayClassCode,
  classCodesMatch,
} from "@/lib/acaManagementApi";
import { DEFAULT_COURSE_RLP_SESSIONS, calculateGradingDeadline, type RlpSession, type Attendance, type HomeworkStatus } from "@/lib/courseSchedule";
import { refreshRlpSessions, updateRlpSession } from "@/lib/rlpSessionStore";
import { getCachedAuthUser } from "@/lib/auth";

const ALL_TEACHERS = [
  "Nghiêm Doãn Quỳnh Châu",
  "Lê Thị Diệu Linh",
  "Lê Minh Trang",
  "Phạm Hoàng An",
  "Trần Thu Lan",
  "Lê Thanh Tâm",
  "Thái Đỗ Đăng Khoa",
  "Tất Duy Khải",
  "Lê Như Hải",
  "Nguyễn Lê Trung Dũng",
  "Nguyễn Lưu Minh Tâm",
  "Trần Quang Minh",
  "Đặng Duy",
];

const getDefaultRlpSessionsForPhase = (phase: string): RlpSession[] => {
  const normPhase = (phase || "").toUpperCase();
  if (normPhase.includes("W-L")) {
    return [
      {
        no: 1,
        date: "02/10/2025",
        skill: "Writing",
        contents: "Writing Task 1 - Line Graph (Biểu đồ đường): Cấu trúc, Overview & Từ vựng miêu tả xu hướng",
        teacherNote: "—",
        deadline: "09/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 2,
        date: "04/10/2025",
        skill: "Listening",
        contents: "Listening Section 1 - Form Completion: Kỹ năng bắt từ khóa, đánh vần tên riêng & chữ số",
        teacherNote: "—",
        deadline: "11/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 3,
        date: "09/10/2025",
        skill: "Writing",
        contents: "Writing Task 2 - Agree or Disagree Essay: Cách lập dàn ý, viết Introduction & Thesis Statement",
        teacherNote: "—",
        deadline: "16/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 4,
        date: "11/10/2025",
        skill: "Listening",
        contents: "Listening Section 2 - Map Labelling & Matching: Từ vựng chỉ phương hướng & Bản đồ",
        teacherNote: "—",
        deadline: "18/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 5,
        date: "16/10/2025",
        skill: "Writing",
        contents: "Writing Task 1 - Bar Chart (Biểu đồ cột): Cấu trúc so sánh, nhóm số liệu & viết Body paragraphs",
        teacherNote: "—",
        deadline: "23/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 6,
        date: "18/10/2025",
        skill: "Listening",
        contents: "Listening Section 2 - Sentence Completion & Note Completion: Phân tích khoảng trống cần điền",
        teacherNote: "—",
        deadline: "25/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 7,
        date: "20/10/2025",
        skill: "Writing",
        contents: "Writing Task 2 - Discussion Essay: Thảo luận hai quan điểm, viết Body 1 & Body 2",
        teacherNote: "—",
        deadline: "27/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 8,
        date: "22/10/2025",
        skill: "Listening",
        contents: "Listening Section 3 - Multiple Choice: Cách xử lý các nhiễu thông tin (distractors) phức tạp",
        teacherNote: "—",
        deadline: "29/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 9,
        date: "27/10/2025",
        skill: "Writing",
        contents: "Writing Task 1 - Table & Pie Chart (Bảng số liệu & Biểu đồ tròn): Cách phân tích và gộp số liệu",
        teacherNote: "—",
        deadline: "03/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 10,
        date: "29/10/2025",
        skill: "Listening",
        contents: "Listening Section 3 - Classification & Matching: Chiến thuật phân loại thông tin hội thoại",
        teacherNote: "—",
        deadline: "05/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 11,
        date: "03/11/2025",
        skill: "Writing",
        contents: "Writing Task 2 - Advantages & Disadvantages Essay: Phát triển lập luận cân bằng & viết Conclusion",
        teacherNote: "—",
        deadline: "10/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 12,
        date: "05/11/2025",
        skill: "Listening",
        contents: "Listening Section 4 - Academic Lecture Completion: Nghe hiểu và ghi chú bài giảng khoa học",
        teacherNote: "—",
        deadline: "12/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 13,
        date: "10/11/2025",
        skill: "Writing",
        contents: "Writing Task 1 - Mixed Charts (Biểu đồ hỗn hợp): Kỹ năng viết bài khi kết hợp nhiều dạng biểu đồ",
        teacherNote: "—",
        deadline: "17/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 14,
        date: "12/11/2025",
        skill: "Listening",
        contents: "Listening Intensive Practice - Trọn bộ Đề thi nghe thực tế (Section 1-4)",
        teacherNote: "—",
        deadline: "19/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 15,
        date: "17/11/2025",
        skill: "Writing",
        contents: "Writing Task 2 - Problem & Solution / Direct Question Essay: Trả lời câu hỏi trực tiếp",
        teacherNote: "—",
        deadline: "24/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 16,
        date: "19/11/2025",
        skill: "Writing",
        contents: "Writing & Listening Full Mock Simulation: Phòng thi thực tế & Chữa lỗi thường gặp",
        teacherNote: "—",
        deadline: "26/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
    ];
  } else if (normPhase.includes("PRE") || normPhase.includes("CORE")) {
    return [
      {
        no: 1,
        date: "02/10/2025",
        skill: "Speaking",
        contents: "Pre-IELTS Speaking Part 1 - Giới thiệu bản thân, phát âm cơ bản & ngữ điệu tự nhiên",
        teacherNote: "—",
        deadline: "09/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 2,
        date: "04/10/2025",
        skill: "Reading",
        contents: "Reading Skill - Kỹ thuật Skimming & Scanning, nhận diện cấu trúc bài đọc học thuật",
        teacherNote: "—",
        deadline: "11/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 3,
        date: "09/10/2025",
        skill: "Listening",
        contents: "Listening Skill - Nhận diện bảng chữ cái, số đếm, ngày tháng & các bẫy phát âm thường gặp",
        teacherNote: "—",
        deadline: "16/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 4,
        date: "11/10/2025",
        skill: "Writing",
        contents: "Writing Foundation - Cấu trúc câu đơn, câu ghép & tránh các lỗi ngữ pháp cơ bản",
        teacherNote: "—",
        deadline: "18/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 5,
        date: "16/10/2025",
        skill: "Speaking",
        contents: "Speaking Part 1 - Mở rộng câu trả lời bằng cách nêu ví dụ, lý do và tương phản",
        teacherNote: "—",
        deadline: "23/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 6,
        date: "18/10/2025",
        skill: "Reading",
        contents: "Reading - Kỹ năng định vị từ khóa (Keywords) & tìm từ đồng nghĩa (Synonyms) trong văn cảnh",
        teacherNote: "—",
        deadline: "25/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 7,
        date: "20/10/2025",
        skill: "Listening",
        contents: "Listening - Nghe hiểu các đoạn hội thoại thường nhật (Section 1) & Điền thông tin vào mẫu",
        teacherNote: "—",
        deadline: "27/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 8,
        date: "22/10/2025",
        skill: "Writing",
        contents: "Writing - Phương pháp viết câu phức, sử dụng mệnh đề quan hệ & liên từ liên kết ý",
        teacherNote: "—",
        deadline: "29/10/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 9,
        date: "27/10/2025",
        skill: "Speaking",
        contents: "Speaking Part 2 - Xây dựng cốt truyện (Storytelling) & Phân tích chủ đề miêu tả người",
        teacherNote: "—",
        deadline: "03/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 10,
        date: "29/10/2025",
        skill: "Reading",
        contents: "Reading - Tiếp cận dạng bài True / False / Not Given & cách phân biệt chính xác",
        teacherNote: "—",
        deadline: "05/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 11,
        date: "03/11/2025",
        skill: "Listening",
        contents: "Listening - Kỹ năng định vị bản đồ & nhận diện từ chỉ vị trí, phương hướng (Section 2)",
        teacherNote: "—",
        deadline: "10/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 12,
        date: "05/11/2025",
        skill: "Writing",
        contents: "Writing Task 1 Intro - Tiếp cận và phân tích biểu đồ đường (Line graph) & viết Overview",
        teacherNote: "—",
        deadline: "12/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 13,
        date: "10/11/2025",
        skill: "Speaking",
        contents: "Speaking Part 2 - Describe a place: Từ vựng miêu tả địa điểm, phong cảnh & trải nghiệm",
        teacherNote: "—",
        deadline: "17/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 14,
        date: "12/11/2025",
        skill: "Reading",
        contents: "Reading - Tiếp cận dạng bài Matching Headings (Tìm tiêu đề cho đoạn văn)",
        teacherNote: "—",
        deadline: "19/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 15,
        date: "17/11/2025",
        skill: "Listening",
        contents: "Listening Section 2 - Trắc nghiệm nhiều lựa chọn (Multiple choice) & chiến thuật loại trừ",
        teacherNote: "—",
        deadline: "24/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
      {
        no: 16,
        date: "19/11/2025",
        skill: "Writing",
        contents: "Writing Task 2 Intro - Cấu trúc bài luận cơ bản (4 đoạn) & cách phát triển ý chính",
        teacherNote: "—",
        deadline: "26/11/2025",
        homeworkStatus: "not_assigned",
        attendance: "present",
      },
    ];
  }

  // Default to Speaking & Reading (S-R) 16 sessions template
  return [
    {
      no: 1,
      date: "02/10/2025",
      skill: "Speaking",
      contents: "Introduction to Speaking Part 1 - chiến thuật trả lời chủ đề Work, Hobbies, Travel",
      teacherNote: "Đã nắm được đủ cấu trúc trả lời Part 1, mở rộng ví linh hoạt được.",
      deadline: "09/10/2025",
      homeworkStatus: "submitted",
      attendance: "present",
      lessonFileUrl: "https://example.com/tailieu-part1.pdf",
    },
    {
      no: 2,
      date: "04/10/2025",
      skill: "Speaking",
      contents: "Speaking Part 2 - Descriptive language, Describe a person",
      teacherNote: "Hiểu yêu cầu Part 2, thiếu từ vựng cụ thể, cần luyện thêm chèn story.",
      deadline: "11/10/2025",
      homeworkStatus: "submitted",
      attendance: "present",
      lessonFileUrl: "https://example.com/bai-tap-describe-person.docx",
    },
    {
      no: 3,
      date: "09/10/2025",
      skill: "Reading",
      contents: "Reading - Matching headings, Sentence endings",
      teacherNote: "Nắm cách định vị đáp án Completion, làm được từ khóa T/F/NG.",
      deadline: "16/10/2025",
      homeworkStatus: "overdue",
      attendance: "present",
      lessonFileUrl: "https://example.com/slides-headings.pptx",
    },
    {
      no: 4,
      date: "11/10/2025",
      skill: "Speaking",
      contents: "Speaking Part 2 - Describe an item, phát âm & giọng cuối câu",
      teacherNote: "Cần chú ý hạ giọng khi phát âm, đã biết ở cuối câu hay cụm từ.",
      deadline: "18/10/2025",
      homeworkStatus: "in_progress",
      attendance: "absent",
      lessonFileUrl: "https://example.com/bang-diem-danh-phat-am.xlsx",
    },
    {
      no: 5,
      date: "16/10/2025",
      skill: "Speaking",
      contents: "Speaking Part 3 - Chiến thuật câu hỏi, phát triển ý",
      teacherNote: "Nắm được cách kéo dài để suy nghĩ idea cho Part 3.",
      deadline: "23/10/2025",
      homeworkStatus: "submitted",
      attendance: "present",
      lessonFileUrl: "https://xalo.edu.vn",
    },
    {
      no: 6,
      date: "18/10/2025",
      skill: "Reading",
      contents: "Reading - Matching features, Matching information",
      teacherNote: "Hiểu cách đọc dày để áp dụng vào bài Matching headings.",
      deadline: "25/10/2025",
      homeworkStatus: "submitted",
      attendance: "present",
    },
    {
      no: 7,
      date: "18/10/2025",
      skill: "Speaking",
      contents: "Speaking Part 2 - Describe a place, cleft sentence",
      teacherNote: "Hiểu ứng dụng cleft sentence, cần luyện thêm để thành nhuần nhuyễn.",
      deadline: "25/10/2025",
      homeworkStatus: "not_assigned",
      attendance: "absent",
    },
    {
      no: 8,
      date: "21/10/2025",
      skill: "Speaking",
      contents: "Speaking Part 2 & 3 liên tục, tạo ngữ cơ bản, nguyên âm đôi",
      teacherNote: "Nắm mẫu câu tạo ngữ căn bản, cần luyện phát âm nguyên âm đôi.",
      deadline: "28/10/2025",
      homeworkStatus: "submitted",
      attendance: "present",
    },
    {
      no: 9,
      date: "23/10/2025",
      skill: "Reading",
      contents: "Reading - Multiple choice (Passage 2)",
      teacherNote: "Xử lý tốt dạng multiple choice đoạn học thuật.",
      deadline: "30/10/2025",
      homeworkStatus: "in_progress",
      attendance: "present",
    },
    {
      no: 10,
      date: "25/10/2025",
      skill: "Speaking",
      contents: "Speaking Part 1 - Accommodation, Sport, Transportation",
      teacherNote: "Diễn đạt hẹp hơn, nắm thành phần câu cơ bản.",
      deadline: "01/11/2025",
      homeworkStatus: "submitted",
      attendance: "present",
    },
    {
      no: 11,
      date: "28/10/2025",
      skill: "Speaking",
      contents: "Speaking Part 2 - Story telling, Describe an experience",
      teacherNote: "Luyện cụm động từ danh từ, đa phần hình thành cụm danh từ cơ bản.",
      deadline: "04/11/2025",
      homeworkStatus: "overdue",
      attendance: "present",
    },
    {
      no: 12,
      date: "30/10/2025",
      skill: "Reading",
      contents: "Reading - Information Identification (T/F/NG, Y/N/NG)",
      teacherNote: "Nắm cách đọc lấy thông tin và so sánh với câu hỏi.",
      deadline: "06/11/2025",
      homeworkStatus: "submitted",
      attendance: "present",
    },
    {
      no: 13,
      date: "25/04/2026",
      skill: "Speaking",
      contents: "Speaking Part 2 - Describe an event (Chặng 1)",
      teacherNote: "—",
      deadline: "02/05/2026",
      homeworkStatus: "in_progress",
      attendance: "present",
    },
    {
      no: 14,
      date: "28/04/2026",
      skill: "Reading",
      contents: "Reading - Summary completion, flow-chart",
      teacherNote: "—",
      deadline: "05/05/2026",
      homeworkStatus: "not_assigned",
      attendance: "absent",
    },
    {
      no: 15,
      date: "25/05/2026",
      skill: "Speaking",
      contents: "Speaking mock round - Full test simulation",
      teacherNote: "—",
      deadline: "26/05/2026",
      homeworkStatus: "not_assigned",
      attendance: "present",
    },
    {
      no: 16,
      date: "27/05/2026",
      skill: "Reading",
      contents: "Reading intensive - Mixed question types review",
      teacherNote: "—",
      deadline: "30/05/2026",
      homeworkStatus: "not_assigned",
      attendance: "present",
    },
  ];
};

// ─── Class management helpers (copied from ACA monthly classes page) ────────
function hasRecordedScore(value: unknown): boolean {
  const s = String(value ?? "").trim();
  return s !== "" && s !== "-";
}

const parseDDMMYYYY = (s: string): Date | null => {
  if (!s) return null;
  const parts = s.split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m, d);
};

const formatDDMMYYYY = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
};

const adjustToClassDay = (date: Date, classDays: number[]) => {
  if (classDays.length === 0) return date;
  const result = new Date(date.getTime());
  for (let i = 0; i < 7; i++) {
    if (classDays.includes(result.getDay())) {
      return result;
    }
    result.setDate(result.getDate() + 1);
  }
  return date;
};

interface ClassSchedule {
  days: number[];
  daysLabel: string;
  timeRange: string;
  duration: number;
  cleanName: string;
}

function parseDDMMYYYYtoYYYYMMDD(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return "";
}

function parseYYYYMMDDtoDDMMYYYY(isoStr: string): string {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  }
  return isoStr;
}

const parseClassSchedule = (name: string, classCode?: string): ClassSchedule => {
  const nameLower = `${name || ""} ${classCode || ""}`.toLowerCase();
  
  let days: number[] = [];
  let daysLabel = "";
  if (nameLower.includes("246") || nameLower.includes("mwf") || nameLower.includes("m/w/f")) {
    days = [1, 3, 5];
    daysLabel = "T2-T4-T6";
  } else if (nameLower.includes("357") || nameLower.includes("tts") || nameLower.includes("t/t/s")) {
    days = [2, 4, 6];
    daysLabel = "T3-T5-T7";
  } else if (nameLower.includes("s/s") || nameLower.includes("t7cn") || nameLower.includes("t7 cn")) {
    days = [6, 0];
    daysLabel = "T7-CN";
  }
  
  let timeRange = "18:00 - 19:45";
  let duration = 1.75;
  
  if (nameLower.includes("c2")) {
    timeRange = "19:45 - 21:30";
    duration = 1.75;
  } else if (nameLower.includes("c1")) {
    timeRange = "18:00 - 19:45";
    duration = 1.75;
  } else if (nameLower.includes("18002000")) {
    timeRange = "18:00 - 20:00";
    duration = 2.0;
  } else if (nameLower.includes("20002200")) {
    timeRange = "20:00 - 22:00";
    duration = 2.0;
  }
  
  let cleanName = "LỚP";
  if (nameLower.includes("momentum")) cleanName = "MOMENTUM";
  else if (nameLower.includes("upstream")) cleanName = "UPSTREAM";
  else if (nameLower.includes("soar")) cleanName = "SOAR";
  else if (nameLower.includes("advanced")) cleanName = "ADVANCED";
  else if (nameLower.includes("foundation")) cleanName = "FOUNDATION";
  else if (nameLower.includes("pre core")) cleanName = "PRE CORE";
  else {
    const parts = name.split(" - ");
    if (parts[0]) {
      cleanName = parts[0].replace("XLE RLP_", "").trim().toUpperCase();
    }
  }
  
  return { days, daysLabel, timeRange, duration, cleanName };
};

const getPhaseDurationDays = (name: string, code: string, customDuration?: number): number => {
  if (customDuration !== undefined && customDuration > 0) {
    return customDuration;
  }
  const nameUpper = (name || "").toUpperCase();
  const codeUpper = (code || "").toUpperCase();
  
  if (nameUpper.includes("FOU") || nameUpper.includes("FOUND") || codeUpper.includes("FOU") || codeUpper.includes("FOUND")) {
    return 105;
  }
  if (nameUpper.includes("PRE CORE") || nameUpper.includes("PCORE") || nameUpper.includes("PRECORE") || 
      nameUpper.includes("PRE IELTS") || nameUpper.includes("PREIELTS") || nameUpper.includes("CORE") ||
      codeUpper.includes("PRE CORE") || codeUpper.includes("PCORE") || codeUpper.includes("PRECORE") || 
      codeUpper.includes("PRE IELTS") || codeUpper.includes("PREIELTS") || codeUpper.includes("CORE") ||
      codeUpper.startsWith("PC")) {
    return 60;
  }
  return 42;
};

const isStudentFinishedClass = (st: AcaStudent, classCode: string): boolean => {
  if (!classCode) return false;
  const cyclesForClass = st.cycles?.filter((cyc) => classCodesMatch(cyc.classCode, classCode)) || [];
  const lFields: { code: string; score: string }[] = [];
  if (classCodesMatch(st.l1, classCode)) lFields.push({ code: st.l1!, score: st.f1 || "" });
  if (classCodesMatch(st.l2, classCode)) lFields.push({ code: st.l2!, score: st.f2 || "" });
  if (classCodesMatch(st.l3, classCode)) lFields.push({ code: st.l3!, score: st.f3 || "" });
  
  let completedCount = 0;
  let hasUnfinished = false;

  if (cyclesForClass.length > 0) {
    completedCount = cyclesForClass.filter((cyc) => hasRecordedScore(cyc.finalScore)).length;
    hasUnfinished = cyclesForClass.some((cyc) => !hasRecordedScore(cyc.finalScore));
  } else if (lFields.length > 0) {
    completedCount = lFields.filter((lf) => hasRecordedScore(lf.score)).length;
    hasUnfinished = lFields.some((lf) => !hasRecordedScore(lf.score));
  }

  const codeUpper = classCode.toUpperCase();
  const isFoundation = codeUpper.includes("FOU") || codeUpper.includes("FOUND");
  const requiredPhases = isFoundation ? 1 : 2;

  return completedCount >= requiredPhases && !hasUnfinished;
};

interface ProjectedPhase {
  phaseName: string;
  startDateStr: string;
  phaseIndex: number;
  isCurrent: boolean;
}

const getProjectedPhasesForYear = (
  cls: AcaClass,
  selectedYear: number
): ProjectedPhase[] => {
  const parseDate = (dStr: string): Date | null => {
    if (!dStr || dStr === "Chưa xếp" || dStr === "-") return null;
    const parts = dStr.split("/");
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const nameUpper = (cls.name || "").toUpperCase();
  const codeUpper = (cls.classCode || "").toUpperCase();
  const isFoundation = nameUpper.includes("FOU") || nameUpper.includes("FOUND") || codeUpper.includes("FOU") || codeUpper.includes("FOUND");
  const isPreCore = nameUpper.includes("PRE CORE") || nameUpper.includes("PCORE") || nameUpper.includes("PRECORE") || 
                    nameUpper.includes("PRE IELTS") || nameUpper.includes("PREIELTS") || nameUpper.includes("CORE") ||
                    codeUpper.includes("PRE CORE") || codeUpper.includes("PCORE") || codeUpper.includes("PRECORE") || 
                    codeUpper.includes("PRE IELTS") || codeUpper.includes("PREIELTS") || codeUpper.includes("CORE");

  const dOpen = parseDate(cls.openDate);
  if (!dOpen) return [];

  const phases: ProjectedPhase[] = [];

  if (isFoundation) {
    phases.push({
      phaseName: "Foundation",
      startDateStr: cls.openDate,
      phaseIndex: 0,
      isCurrent: true
    });
    return phases;
  }

  if (isPreCore) {
    phases.push({
      phaseName: cls.currentPhase || "S-R",
      startDateStr: cls.phaseStartDate || cls.openDate,
      phaseIndex: 0,
      isCurrent: (cls.currentPhase || "").toUpperCase().includes("CORE") || !(cls.nextPhase || "").toUpperCase().includes("CORE")
    });
    if (cls.nextPhase && cls.nextPhase !== "-") {
      phases.push({
        phaseName: cls.nextPhase,
        startDateStr: cls.nextPhaseStartDate || "",
        phaseIndex: 1,
        isCurrent: !phases[0].isCurrent
      });
    }
    return phases;
  }

  const firstPhaseIsWL = !(cls.currentPhase && (cls.currentPhase.toUpperCase().includes("S") || cls.currentPhase.toUpperCase().includes("R")));
  const step0isWL = firstPhaseIsWL;

  const schedule = parseClassSchedule(cls.name, cls.classCode);
  const classDays = schedule.days;

  let currentDate = new Date(dOpen.getTime());
  currentDate = adjustToClassDay(currentDate, classDays);

  const targetEnd = new Date(selectedYear, 11, 31, 23, 59, 59);

  let step = 0;
  while (currentDate <= targetEnd && step < 100) {
    const isWL = step % 2 === 0 ? step0isWL : !step0isWL;
    const phaseName = isWL ? "W-L" : "S-R";
    const startDateStr = formatDDMMYYYY(currentDate);

    phases.push({
      phaseName,
      startDateStr,
      phaseIndex: step,
      isCurrent: false
    });

    const nextDate = new Date(currentDate.getTime());
    const offsetDays = getPhaseDurationDays(cls.name, cls.classCode, cls.phaseDurationDays);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    currentDate = adjustToClassDay(nextDate, classDays);
    step++;
  }

  if (phases.length > 0) {
    const today = new Date();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const mapped = phases.map((p) => {
      const d = parseDate(p.startDateStr) || new Date(2000, 0, 1);
      return {
        phase: p,
        time: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      };
    }).sort((a, b) => a.time - b.time);

    let activeIndex = 0;
    let foundToday = false;
    for (let i = 0; i < mapped.length; i++) {
      const start = mapped[i].time;
      const end = i < mapped.length - 1 ? mapped[i + 1].time : Infinity;
      if (todayTime >= start && todayTime < end) {
        activeIndex = mapped[i].phase.phaseIndex;
        foundToday = true;
        break;
      }
    }

    if (!foundToday) {
      const currName = (cls.currentPhase || "").toUpperCase();
      const matchByName = phases.find(p => p.phaseName.toUpperCase() === currName);
      if (matchByName) {
        activeIndex = matchByName.phaseIndex;
      } else {
        activeIndex = phases[0].phaseIndex;
      }
    }
    
    phases.forEach(p => {
      p.isCurrent = p.phaseIndex === activeIndex;
    });
  }

  return phases;
};

const isRecruitedForNextPhase = (st: AcaStudent, c: AcaClass, selectedYear: number): boolean => {
  if (st.classId !== c.id) return false;
  if (isStudentFinishedClass(st, c.classCode)) return false;
  
  const cls = (st.classification || "").trim();
  const isLopLeMoi = cls === "Lớp lẻ mới" || cls.toLowerCase().includes("mới") || cls.toLowerCase().includes("tuyển") || cls.toLowerCase().includes("học bổng") || cls.toLowerCase().includes("new");
  const isCombo = cls === "Combo" || cls.toLowerCase().includes("combo");
  if (!isLopLeMoi && !isCombo) return false;
  
  const projected = getProjectedPhasesForYear(c, selectedYear);
  const currentPhase = projected.find(p => p.isCurrent);
  if (!currentPhase) return false;
  
  const nextPhaseIndex = currentPhase.phaseIndex + 1;
  const classCycles = st.cycles || [];
  const matchesNextCycle = (classCycles.length > 0 && classCodesMatch(classCycles[nextPhaseIndex]?.classCode, c.classCode)) ||
                           (nextPhaseIndex === 0 && classCodesMatch(st.l1, c.classCode)) ||
                           (nextPhaseIndex === 1 && classCodesMatch(st.l2, c.classCode)) ||
                           (nextPhaseIndex === 2 && classCodesMatch(st.l3, c.classCode));
  return matchesNextCycle;
};


export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [classes11, setClasses11] = useState<Aca11Class[]>([]);
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drilldown navigation states
  const [selectedClass, setSelectedClass] = useState<AcaClass | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AcaStudent | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "attendance" | "rlp" | "homework">("students");
  const [attendanceSessionNo, setAttendanceSessionNo] = useState<number>(1);
  const [rlpVersion, setRlpVersion] = useState(0);

  // RLP sessions state for the active student
  const [studentRlp, setStudentRlp] = useState<RlpSession[]>([]);
  const [activeSessionNo, setActiveSessionNo] = useState<number | null>(null);

  // RLP tab modal draft states
  const [rlpEditSession, setRlpEditSession] = useState<RlpSession | null>(null);
  const [rlpSkillDraft, setRlpSkillDraft] = useState<string>("Speaking");
  const [rlpContentsDraft, setRlpContentsDraft] = useState<string>("");
  const [rlpNoteDraft, setRlpNoteDraft] = useState<string>("");
  const [rlpLessonFileDraft, setRlpLessonFileDraft] = useState<string>("");
  const [rlpRecordDraft, setRlpRecordDraft] = useState<string>("");
  const [rlpSaving, setRlpSaving] = useState<boolean>(false);

  // Homework tab modal draft states
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [homeworkEditSession, setHomeworkEditSession] = useState<RlpSession | null>(null);
  const [homeworkFileDraft, setHomeworkFileDraft] = useState<string>("");
  const [homeworkDeadlineDraft, setHomeworkDeadlineDraft] = useState<string>("");
  const [homeworkNoteDraft, setHomeworkNoteDraft] = useState<string>("");
  const [homeworkSaving, setHomeworkSaving] = useState<boolean>(false);

  const handleOpenCalendar = () => {
    const inputEl = dateInputRef.current;
    if (inputEl) {
      if (typeof inputEl.showPicker === "function") {
        try {
          inputEl.showPicker();
        } catch {
          inputEl.focus();
        }
      } else {
        inputEl.focus();
      }
    }
  };
  
  // Edit modal draft states
  const [editStatus, setEditStatus] = useState<HomeworkStatus>("in_progress");
  const [editAttendance, setEditAttendance] = useState<Attendance>("present");
  const [editLessonFile, setEditLessonFile] = useState("");
  const [editHomeworkFile, setEditHomeworkFile] = useState("");
  const [editTeacherNote, setEditTeacherNote] = useState("");
  const [savingRlp, setSavingRlp] = useState(false);

  // Fetch all database records
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clsList, cls11List, stList] = await Promise.all([
        fetchAcaClasses(),
        fetchAca11Classes(),
        fetchAcaStudents(),
      ]);
      setClasses(clsList);
      setClasses11(cls11List);
      setStudents(stList);
    } catch (err: any) {
      setError(err.message || "Không tải được danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load RLP sessions for the selected student
  useEffect(() => {
    let cancelled = false;
    async function loadRlp() {
      if (!selectedStudent) {
        setStudentRlp([]);
        return;
      }
      if (selectedClass?.id) {
        try {
          const apiSessions = await refreshRlpSessions(selectedClass.id);
          if (!cancelled && apiSessions && apiSessions.length > 0) {
            setStudentRlp(apiSessions);
            return;
          }
        } catch {
          // ignore
        }
      }
      const savedKey = `xalo.course.rlpSessions.${selectedStudent.id}.v1`;
      const saved = window.localStorage.getItem(savedKey);
      const phase = selectedClass?.currentPhase || "S-R";
      const defaultSessions = getDefaultRlpSessionsForPhase(phase);
      if (saved) {
        try {
          if (!cancelled) setStudentRlp(JSON.parse(saved));
        } catch {
          if (!cancelled) setStudentRlp(defaultSessions);
        }
      } else {
        if (!cancelled) setStudentRlp(defaultSessions);
      }
    }
    void loadRlp();
    return () => {
      cancelled = true;
    };
  }, [selectedStudent, selectedClass, rlpVersion]);

  // Save RLP sessions to student specific key in localStorage
  const saveStudentRlp = (sessions: RlpSession[]) => {
    if (!selectedStudent) return;
    const savedKey = `xalo.course.rlpSessions.${selectedStudent.id}.v1`;
    window.localStorage.setItem(savedKey, JSON.stringify(sessions));
    setStudentRlp(sessions);
    setRlpVersion((v) => v + 1);
  };

  const activeTeacherDisplay = useMemo(() => {
    const cached = getCachedAuthUser();
    if (cached && cached.name) return cached.name;
    return "Quỳnh Châu";
  }, []);

  // Filter classes taught by logged in teacher and sort by newest phase/open date first
  const myClasses = useMemo(() => {
    const getSortDate = (c: AcaClass): number => {
      const dateObj = parseDDMMYYYY(c.phaseStartDate) || parseDDMMYYYY(c.openDate) || new Date(0);
      return dateObj.getTime();
    };

    const filterName = activeTeacherDisplay.trim().toLowerCase();
    const words = filterName.split(" ").filter(Boolean);
    const lastTwoWords = words.length >= 2 ? words.slice(-2).join(" ") : filterName;
    const lastTwoVariant = lastTwoWords.replace("đặng", "đăng").replace("đăng", "đặng");

    const filtered = classes.filter((c) => {
      const cTeacher = (c.teacher || "").toLowerCase();
      const cName = (c.name || "").toLowerCase();

      return (
        cTeacher.includes(filterName) ||
        cName.includes(filterName) ||
        (lastTwoWords && (cTeacher.includes(lastTwoWords) || cName.includes(lastTwoWords))) ||
        (lastTwoVariant && (cTeacher.includes(lastTwoVariant) || cName.includes(lastTwoVariant)))
      );
    });

    // De-duplicate by classCode (or name if code is missing) to prevent duplicate rows from parallel seeding
    const seen = new Set<string>();
    const unique: AcaClass[] = [];
    for (const c of filtered) {
      const key = c.classCode || c.name;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }

    return unique.sort((a, b) => getSortDate(b) - getSortDate(a));
  }, [classes, activeTeacherDisplay]);

  // Filter students belonging to selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    
    // Support matching by all possible duplicate class IDs that have the same classCode or name
    const matchingClassIds = new Set<string>([selectedClass.id]);
    for (const c of classes) {
      if (
        (selectedClass.classCode && classCodesMatch(c.classCode, selectedClass.classCode)) ||
        c.name === selectedClass.name
      ) {
        matchingClassIds.add(c.id);
      }
    }

    const filtered = students.filter(
      (s) =>
        matchingClassIds.has(s.classId) ||
        s.classId === selectedClass.id ||
        s.classId === selectedClass.name
    );

    // De-duplicate students to clean up duplicates from MongoDB parallel seeding
    const seen = new Set<string>();
    const unique: AcaStudent[] = [];
    for (const st of filtered) {
      const key = `${st.name}_${st.phone || ""}_${st.email || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(st);
      }
    }

    return unique;
  }, [students, selectedClass, classes]);

  // Load RLP sessions for all students in the selected class
  const classStudentsRlp = useMemo(() => {
    if (!selectedClass) return {};
    const map: Record<string, RlpSession[]> = {};
    const phase = selectedClass.currentPhase || "S-R";
    const defaultSessions = getDefaultRlpSessionsForPhase(phase);

    for (const st of classStudents) {
      const savedKey = `xalo.course.rlpSessions.${st.id}.v1`;
      const saved = window.localStorage.getItem(savedKey);
      if (saved) {
        try {
          map[st.id] = JSON.parse(saved);
        } catch {
          map[st.id] = defaultSessions;
        }
      } else {
        map[st.id] = defaultSessions;
      }
    }
    return map;
  }, [selectedClass, classStudents, rlpVersion]);

  // Toggle student attendance from class attendance matrix
  const toggleStudentAttendance = async (studentId: string, sessionNo: number) => {
    const savedKey = `xalo.course.rlpSessions.${studentId}.v1`;
    let currentSessions: RlpSession[] = [];
    const saved = window.localStorage.getItem(savedKey);
    const phase = selectedClass?.currentPhase || "S-R";
    const defaultSessions = getDefaultRlpSessionsForPhase(phase);

    if (saved) {
      try {
        currentSessions = JSON.parse(saved);
      } catch {
        currentSessions = [...defaultSessions];
      }
    } else {
      currentSessions = [...defaultSessions];
    }
    const targetSession = currentSessions.find((s) => s.no === sessionNo);
    const nextAttendance = (targetSession?.attendance === "present" ? "absent" : "present") as Attendance;
    const updated = currentSessions.map((s) => {
      if (s.no === sessionNo) {
        return {
          ...s,
          attendance: nextAttendance,
        };
      }
      return s;
    });
    window.localStorage.setItem(savedKey, JSON.stringify(updated));
    setRlpVersion((v) => v + 1);

    try {
      await updateRlpSession(sessionNo, { attendance: nextAttendance }, selectedClass?.id);
    } catch {
      // ignore
    }
  };

  // Bulk mark all students for a session as present/absent
  const setAllAttendanceForSession = async (sessionNo: number, status: Attendance) => {
    classStudents.forEach((st) => {
      const savedKey = `xalo.course.rlpSessions.${st.id}.v1`;
      let currentSessions: RlpSession[] = [];
      const saved = window.localStorage.getItem(savedKey);
      const phase = selectedClass?.currentPhase || "S-R";
      const defaultSessions = getDefaultRlpSessionsForPhase(phase);

      if (saved) {
        try {
          currentSessions = JSON.parse(saved);
        } catch {
          currentSessions = [...defaultSessions];
        }
      } else {
        currentSessions = [...defaultSessions];
      }
      const updated = currentSessions.map((s) => {
        if (s.no === sessionNo) {
          return { ...s, attendance: status };
        }
        return s;
      });
      window.localStorage.setItem(savedKey, JSON.stringify(updated));
    });
    setRlpVersion((v) => v + 1);

    try {
      await updateRlpSession(sessionNo, { attendance: status }, selectedClass?.id);
    } catch {
      // ignore
    }
  };

  // Deadline check function: true if lesson date >7 days ago and still "Chưa chấm"
  const checkIsOverdue = (dateStr: string, status: HomeworkStatus) => {
    if (status === "submitted") return false; // Graded, not overdue

    const parts = dateStr.split("/");
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const sessionDate = new Date(year, month, day);

    // Context current date: June 19, 2026
    const CURRENT_DATE = new Date(2026, 5, 19);
    const diffTime = CURRENT_DATE.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 7;
  };

  // Attendance summary metrics
  const attendanceMetrics = useMemo(() => {
    const activeSessions = studentRlp.slice(0, 16);
    if (activeSessions.length === 0) return { present: 0, absent: 0, rate: 0, total: 0 };
    const present = activeSessions.filter((s) => s.attendance === "present").length;
    const absent = activeSessions.filter((s) => s.attendance === "absent").length;
    const rate = Math.round((present / activeSessions.length) * 100);
    return { present, absent, rate, total: activeSessions.length };
  }, [studentRlp]);

  // Get all cycles for the selected student
  const studentCycles = useMemo(() => {
    if (!selectedStudent) return [];
    
    const getCycleDataLocal = (st: AcaStudent, index: number): AcaStudentCycle => {
      if (st.cycles && st.cycles[index]) {
        return st.cycles[index];
      }
      if (index === 0) {
        return {
          classCode: st.l1 || "",
          finalScore: st.f1 || "",
          registeredWriting: !!st.registeredWriting,
          registeredMocktest: !!st.registeredMocktest,
          registeredLuyenDe: !!st.registeredLuyenDe,
          homeworkPercent: st.homeworkPercent || "",
          attendanceCount: st.attendanceCount || "",
        };
      }
      if (index === 1) {
        return {
          classCode: st.l2 || "",
          finalScore: st.f2 || "",
          registeredWriting: !!st.registeredWriting2,
          registeredMocktest: !!st.registeredMocktest2,
          registeredLuyenDe: !!st.registeredLuyenDe2,
          homeworkPercent: st.homeworkPercent2 || "",
          attendanceCount: st.attendanceCount2 || "",
        };
      }
      if (index === 2) {
        return {
          classCode: st.l3 || "",
          finalScore: st.f3 || "",
          registeredWriting: !!st.registeredWriting3,
          registeredMocktest: !!st.registeredMocktest3,
          registeredLuyenDe: !!st.registeredLuyenDe3,
          homeworkPercent: st.homeworkPercent3 || "",
          attendanceCount: st.attendanceCount3 || "",
        };
      }
      return {
        classCode: "",
        finalScore: "",
        registeredWriting: false,
        registeredMocktest: false,
        registeredLuyenDe: false,
        homeworkPercent: "",
        attendanceCount: "",
      };
    };

    const maxCycles = Math.max(
      selectedStudent.cycles?.length || 0,
      selectedStudent.l3 ? 3 : selectedStudent.l2 ? 2 : 1
    );
    
    return Array.from({ length: maxCycles }).map((_, idx) => getCycleDataLocal(selectedStudent, idx));
  }, [selectedStudent]);

  // Handle open RLP edit modal
  const handleOpenEdit = (session: RlpSession) => {
    setActiveSessionNo(session.no);
    setEditStatus(session.homeworkStatus);
    setEditAttendance(session.attendance);
    setEditLessonFile(session.lessonFileUrl || "");
    setEditHomeworkFile(session.homeworkFileUrl || "");
    setEditTeacherNote(session.teacherNote === "—" ? "" : session.teacherNote);
  };

  // Handle save RLP edits
  const handleSaveRlp = async () => {
    if (activeSessionNo === null) return;
    setSavingRlp(true);
    try {
      const updated = studentRlp.map((s) => {
        if (s.no !== activeSessionNo) return s;
        return {
          ...s,
          homeworkStatus: editStatus,
          attendance: editAttendance,
          lessonFileUrl: editLessonFile.trim(),
          homeworkFileUrl: editHomeworkFile.trim(),
          teacherNote: editTeacherNote.trim() || "—",
        };
      });

      saveStudentRlp(updated);

      await updateRlpSession(
        activeSessionNo,
        {
          homeworkStatus: editStatus,
          attendance: editAttendance,
          lessonFileUrl: editLessonFile.trim(),
          homeworkFileUrl: editHomeworkFile.trim(),
          teacherNote: editTeacherNote.trim() || "—",
        },
        selectedClass?.id,
      );
    } catch (err: any) {
      console.error("Failed API sync handleSaveRlp:", err);
    } finally {
      setSavingRlp(false);
      setActiveSessionNo(null);
    }
  };

  // Handle open Homework edit modal
  const handleOpenHomeworkEdit = (session: RlpSession) => {
    setHomeworkEditSession(session);
    setHomeworkFileDraft(session.homeworkFileUrl || "");
    setHomeworkDeadlineDraft(session.deadline || "");
    setHomeworkNoteDraft(session.teacherNote === "—" ? "" : session.teacherNote);
  };

  // Handle save Homework for all students in selected class
  const handleSaveHomeworkForClass = async () => {
    if (!homeworkEditSession || !selectedClass) return;
    setHomeworkSaving(true);
    try {
      const sessionNo = homeworkEditSession.no;
      for (const st of classStudents) {
        const savedKey = `xalo.course.rlpSessions.${st.id}.v1`;
        const saved = window.localStorage.getItem(savedKey);
        let currentRlp: RlpSession[] = getDefaultRlpSessionsForPhase(selectedClass.currentPhase || "S-R");
        if (saved) {
          try { currentRlp = JSON.parse(saved); } catch {}
        }
        const updatedRlp = currentRlp.map((row) => {
          if (row.no === sessionNo) {
            return {
              ...row,
              homeworkFileUrl: homeworkFileDraft.trim(),
              deadline: homeworkDeadlineDraft.trim() || row.deadline,
              teacherNote: homeworkNoteDraft.trim() || "—",
            };
          }
          return row;
        });
        window.localStorage.setItem(savedKey, JSON.stringify(updatedRlp));
      }

      await updateRlpSession(
        sessionNo,
        {
          homeworkFileUrl: homeworkFileDraft.trim(),
          deadline: homeworkDeadlineDraft.trim() || homeworkEditSession.deadline,
          teacherNote: homeworkNoteDraft.trim() || "—",
        },
        selectedClass.id,
      );

      setRlpVersion((v) => v + 1);
      setHomeworkEditSession(null);
    } catch (err: any) {
      alert("Lỗi khi lưu Homework: " + err.message);
    } finally {
      setHomeworkSaving(false);
    }
  };

  // Handle open RLP content edit modal
  const handleOpenRlpContentEdit = (session: RlpSession) => {
    setRlpEditSession(session);
    setRlpSkillDraft(session.skill || "Speaking");
    setRlpContentsDraft(session.contents || "");
    setRlpNoteDraft(session.teacherNote === "—" ? "" : session.teacherNote);
    setRlpLessonFileDraft(session.lessonFileUrl || "");
    setRlpRecordDraft(session.recordingUrl || "");
  };

  // Handle save RLP content for all students in selected class
  const handleSaveRlpContentForClass = async () => {
    if (!rlpEditSession || !selectedClass) return;
    setRlpSaving(true);
    try {
      const sessionNo = rlpEditSession.no;
      for (const st of classStudents) {
        const savedKey = `xalo.course.rlpSessions.${st.id}.v1`;
        const saved = window.localStorage.getItem(savedKey);
        let currentRlp: RlpSession[] = getDefaultRlpSessionsForPhase(selectedClass.currentPhase || "S-R");
        if (saved) {
          try { currentRlp = JSON.parse(saved); } catch {}
        }
        const updatedRlp = currentRlp.map((row) => {
          if (row.no === sessionNo) {
            return {
              ...row,
              skill: rlpSkillDraft.trim() || row.skill,
              contents: rlpContentsDraft.trim() || row.contents,
              teacherNote: rlpNoteDraft.trim() || "—",
              lessonFileUrl: rlpLessonFileDraft.trim(),
              recordingUrl: rlpRecordDraft.trim(),
            };
          }
          return row;
        });
        window.localStorage.setItem(savedKey, JSON.stringify(updatedRlp));
      }

      await updateRlpSession(
        sessionNo,
        {
          skill: rlpSkillDraft.trim() || rlpEditSession.skill,
          contents: rlpContentsDraft.trim() || rlpEditSession.contents,
          teacherNote: rlpNoteDraft.trim() || "—",
          lessonFileUrl: rlpLessonFileDraft.trim(),
          recordingUrl: rlpRecordDraft.trim(),
        },
        selectedClass.id,
      );

      setRlpVersion((v) => v + 1);
      setRlpEditSession(null);
    } catch (err: any) {
      alert("Lỗi khi lưu RLP: " + err.message);
    } finally {
      setRlpSaving(false);
    }
  };

  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Danh sách lớp học"
        subtitle={`Giáo viên: ${activeTeacherDisplay} · Quản lý lớp học, điểm danh và chấm tiến trình RLP học viên.`}
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8 space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm">
            Đang tải dữ liệu giảng dạy...
          </div>
        ) : !selectedClass ? (
          /* Step 1: Class List Table */
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Lớp học bạn phụ trách ({myClasses.length})</h3>
            {myClasses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
                Bạn chưa được gán phụ trách lớp học nào.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
                        <th className="px-6 py-4 min-w-[280px]">Tên lớp / Mã lớp</th>
                        <th className="px-6 py-4 min-w-[130px]">Ngày mở lớp</th>
                        <th className="px-6 py-4 min-w-[130px]">Chặng hiện tại</th>
                        <th className="px-6 py-4 min-w-[150px]">Khai giảng chặng</th>
                        <th className="px-6 py-4 text-center min-w-[110px]">Sĩ số chặng</th>
                        <th className="px-6 py-4 min-w-[180px]">Chặng tiếp theo</th>
                        <th className="px-6 py-4 text-center min-w-[110px]">Cần tuyển</th>
                        <th className="px-6 py-4 min-w-[130px]">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {myClasses.map((c) => {
                        const selectedYear = new Date().getFullYear();
                        const recruitedCount = students.filter(st => isRecruitedForNextPhase(st, c, selectedYear)).length;
                        return (
                          <tr 
                            key={c.id} 
                            onClick={() => setSelectedClass(c)}
                            className="hover:bg-zinc-50/80 align-middle transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 min-w-[280px]">
                              <div className="font-black text-primary hover:underline">{c.name}</div>
                              {c.classCode && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center rounded-md bg-secondary/10 px-1.5 py-0.5 text-[9px] font-black text-secondary tracking-wide">
                                    {displayClassCode(c.classCode)}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-zinc-500 min-w-[130px]">{c.openDate}</td>
                            <td className="px-6 py-4 min-w-[130px]">
                              <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary uppercase">
                                {c.currentPhase}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 min-w-[150px]">{c.phaseStartDate}</td>
                            <td className="px-6 py-4 text-center font-bold tabular-nums text-foreground min-w-[110px]">{c.phaseStudents}</td>
                            <td className="px-6 py-4 min-w-[180px]">
                              <div className="text-zinc-800 font-black">{c.nextPhase}</div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">Khai giảng: {c.nextPhaseStartDate}</div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold tabular-nums text-warning min-w-[110px]">{recruitedCount}/{c.slotsToEnroll}</td>
                            <td className="px-6 py-4 min-w-[130px]">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[9px] font-black uppercase text-success">
                                {c.type}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : !selectedStudent ? (
          /* Step 2: Class Dashboard with Tabs (Students, Attendance, RLP) */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="text-xs font-bold text-[#6a5acd] hover:underline flex items-center gap-1 mb-1"
                >
                  ← Trở lại danh sách lớp
                </button>
                <h3 className="text-base font-extrabold text-zinc-950">{selectedClass.name}</h3>
              </div>

              {/* Tab Selector Buttons */}
              <div className="flex bg-zinc-100 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab("students")}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === "students"
                      ? "bg-white text-primary shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Học viên
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("attendance")}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === "attendance"
                      ? "bg-white text-primary shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Điểm danh lớp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("rlp")}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === "rlp"
                      ? "bg-white text-primary shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  RLP
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("homework")}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === "homework"
                      ? "bg-white text-primary shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Homework
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Student list */}
            {activeTab === "students" && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="p-5 border-b border-zinc-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">Danh sách học viên lớp</h4>
                </div>
                {classStudents.length === 0 ? (
                  <div className="p-8 text-center text-sm text-zinc-500">Lớp học chưa có học viên nào.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <tr>
                          <th className="px-6 py-4">STT</th>
                          <th className="px-6 py-4">Họ và tên</th>
                          <th className="px-6 py-4">Số điện thoại</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                        {classStudents.map((st, index) => (
                          <tr
                            key={st.id}
                            onClick={() => setSelectedStudent(st)}
                            className="hover:bg-zinc-50/70 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 tabular-nums text-zinc-400">{index + 1}</td>
                            <td className="px-6 py-4 font-bold text-zinc-950">{st.name}</td>
                            <td className="px-6 py-4 text-zinc-500">{st.phone || "—"}</td>
                            <td className="px-6 py-4 text-zinc-500">{st.email || "—"}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-primary underline underline-offset-2 hover:text-primary-hover">Chi tiết tt học viên</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Class attendance for selected session/date */}
            {activeTab === "attendance" && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4">
                {/* Header with session/date selector & bulk actions */}
                <div className="p-5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-950">Điểm danh theo ngày học</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Chọn buổi học để thực hiện điểm danh học viên cho ngày hôm đó.</p>
                  </div>

                  {/* Session Selector & Bulk buttons */}
                  {(() => {
                    const phase = selectedClass?.currentPhase || "S-R";
                    const sessionsList = getDefaultRlpSessionsForPhase(phase);
                    const currentSession = sessionsList.find((s) => s.no === attendanceSessionNo) || sessionsList[0];

                    return (
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Select dropdown */}
                        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 shadow-2xs">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Buổi học:</span>
                          <select
                            value={attendanceSessionNo}
                            onChange={(e) => setAttendanceSessionNo(Number(e.target.value))}
                            className="bg-transparent text-xs font-bold text-zinc-900 outline-none cursor-pointer"
                          >
                            {sessionsList.map((s) => (
                              <option key={s.no} value={s.no}>
                                Buổi {s.no} — {s.date} ({s.skill})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Session Date & Skill info badge */}
                        {currentSession && (
                          <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/15 px-3 py-1.5">
                            <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <span className="text-xs font-bold text-primary">
                              Ngày: {currentSession.date} ({currentSession.skill})
                            </span>
                          </div>
                        )}

                        {/* Bulk Action: Mark all present */}
                        <button
                          type="button"
                          onClick={() => setAllAttendanceForSession(attendanceSessionNo, "present")}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors shadow-2xs"
                        >
                          Tất cả đi học
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {classStudents.length === 0 ? (
                  <div className="p-8 text-center text-sm text-zinc-500">Lớp học chưa có học viên nào.</div>
                ) : (
                  <div className="overflow-x-auto">
                    {(() => {
                      const phase = selectedClass?.currentPhase || "S-R";
                      const sessionsList = getDefaultRlpSessionsForPhase(phase);
                      const currentSession = sessionsList.find((s) => s.no === attendanceSessionNo) || sessionsList[0];

                      return (
                        <table className="w-full text-left text-xs border-collapse table-fixed">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <tr>
                              <th className="px-6 py-4 w-[38%]">Học viên</th>
                              <th className="px-6 py-4 text-center w-[31%]">Tổng (16 buổi)</th>
                              <th className="px-6 py-4 text-center w-[31%]">
                                Điểm danh Buổi {attendanceSessionNo} ({currentSession?.date || ""})
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                            {classStudents.map((st) => {
                              const rlpList = classStudentsRlp[st.id] || DEFAULT_COURSE_RLP_SESSIONS;
                              const presentCount = rlpList.filter((s) => s.no <= 16 && s.attendance === "present").length;
                              const session = rlpList.find((s) => s.no === attendanceSessionNo);
                              const isPresent = session ? session.attendance === "present" : true;

                              return (
                                <tr key={st.id} className="hover:bg-zinc-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-zinc-900 text-xs">{st.name}</div>
                                    <div className="text-[10px] text-zinc-400 font-medium">{st.email || st.l1}</div>
                                  </td>

                                  {/* Cột Tổng (16 buổi) */}
                                  <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-black tabular-nums">
                                      {presentCount}/16 buổi đi học
                                    </span>
                                  </td>

                                  {/* Cột điểm danh ngày hôm đó */}
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleStudentAttendance(st.id, attendanceSessionNo)}
                                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-2xs ${
                                        isPresent
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                                          : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                                      }`}
                                      title={`Click để chuyển trạng thái điểm danh buổi ${attendanceSessionNo}`}
                                    >
                                      <span className={`h-2 w-2 rounded-full ${isPresent ? "bg-emerald-500" : "bg-rose-600"}`} />
                                      {isPresent ? "✓ Đi học" : "✕ Vắng học"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Class RLP schedule */}
            {activeTab === "rlp" && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4">
                <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide text-zinc-950">Quản Lý & Cập Nhật Bảng RLP Lớp</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Khớp 100% với bảng RLP học viên: Kỹ năng, Nội dung bài học, Tiến độ (ghi chú GV), File bài học và Trạng thái.</p>
                  </div>
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                    {classStudents.length} học viên trong lớp
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <tr>
                        <th className="px-6 py-3.5 w-16">Buổi</th>
                        <th className="px-6 py-3.5 w-28">Skill</th>
                        <th className="px-6 py-3.5 min-w-[220px]">Nội dung</th>
                        <th className="px-6 py-3.5 min-w-[200px]">Tiến độ (Ghi chú GV)</th>
                        <th className="px-6 py-3.5 w-36 text-primary font-black">Hạn chấm bài</th>
                        <th className="px-6 py-3.5 w-32 text-center">File bài học</th>
                        <th className="px-6 py-3.5 w-32 text-center">Record</th>
                        <th className="px-6 py-3.5 text-right w-28">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {(() => {
                        const firstStudent = classStudents[0];
                        const defaultSessions = getDefaultRlpSessionsForPhase(selectedClass?.currentPhase || "S-R");
                        const rlpSessions = firstStudent
                          ? (classStudentsRlp[firstStudent.id] || defaultSessions)
                          : defaultSessions;

                        return rlpSessions.slice(0, 20).map((row) => (
                          <tr key={row.no} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 tabular-nums text-zinc-950 font-bold">Buổi {row.no}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                                row.skill === "Speaking" ? "bg-primary/10 text-primary" :
                                row.skill === "Reading" ? "bg-info/10 text-info" :
                                row.skill === "Writing" ? "bg-purple-100 text-purple-700" :
                                "bg-amber-100 text-amber-800"
                              }`}>
                                {row.skill}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-900 leading-snug font-semibold max-w-xs break-words">
                              {row.contents}
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-[11px] break-words">
                              {row.teacherNote && row.teacherNote.trim() !== "—" ? (
                                <span className="italic text-zinc-700">"{row.teacherNote}"</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-6 py-4 font-bold text-primary tabular-nums text-xs whitespace-nowrap">
                              {calculateGradingDeadline(row.deadline)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {row.lessonFileUrl?.trim() ? (
                                <a
                                  href={row.lessonFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-success/20 bg-success/10 text-success transition-all hover:bg-success/20 hover:scale-105"
                                  title="Tải file bài học"
                                >
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                </a>
                              ) : (
                                <span className="text-[11px] text-zinc-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {row.recordingUrl?.trim() ? (
                                <a
                                  href={row.recordingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-purple-100 text-purple-700 transition-all hover:bg-purple-200 hover:scale-105"
                                  title="Xem video Record"
                                >
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polygon points="23 7 16 12 23 17 23 7" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                  </svg>
                                </a>
                              ) : (
                                <span className="text-[11px] text-zinc-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenRlpContentEdit(row)}
                                className="rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors"
                              >
                                Cập nhật RLP
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Homework tab for teachers */}
            {activeTab === "homework" && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4">
                <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide text-zinc-950">Quản Lý & Cập Nhật Homework</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Dành riêng cho giáo viên cập nhật bài tập về nhà, file đính kèm, hạn nộp (deadline) và ghi chú dặn dò cho từng buổi học.</p>
                  </div>
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                    {classStudents.length} học viên trong lớp
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <tr>
                        <th className="px-6 py-3.5 w-20">Buổi</th>
                        <th className="px-6 py-3.5 w-28">Kỹ năng</th>
                        <th className="px-6 py-3.5 min-w-[200px]">Nội dung học</th>
                        <th className="px-6 py-3.5 min-w-[180px]">File Bài Tập (Homework File)</th>
                        <th className="px-6 py-3.5 w-36">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Hạn nộp</span>
                          </div>
                        </th>
                        <th className="px-6 py-3.5 min-w-[200px]">Ghi chú & Dặn dò GV</th>
                        <th className="px-6 py-3.5 w-36 text-primary font-black">Hạn chấm bài</th>
                        <th className="px-6 py-3.5 text-right w-28">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {(() => {
                        const firstStudent = classStudents[0];
                        const defaultSessions = getDefaultRlpSessionsForPhase(selectedClass?.currentPhase || "S-R");
                        const rlpSessions = firstStudent
                          ? (classStudentsRlp[firstStudent.id] || defaultSessions)
                          : defaultSessions;

                        return rlpSessions.slice(0, 20).map((row) => (
                          <tr key={row.no} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 tabular-nums text-zinc-950 font-bold">Buổi {row.no}</td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[9px] font-black">
                                {row.skill}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-600 leading-relaxed max-w-xs">
                              {row.contents}
                            </td>
                            <td className="px-6 py-4">
                              {row.homeworkFileUrl ? (
                                <a
                                  href={row.homeworkFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#6a5acd] hover:underline"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                  Tải File Homework
                                </a>
                              ) : (
                                <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                                  Chưa đính kèm
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-bold text-zinc-800 tabular-nums">
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{row.deadline || "—"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-[11px] italic">
                              {row.teacherNote && row.teacherNote !== "—" ? row.teacherNote : "Chưa có ghi chú"}
                            </td>
                            <td className="px-6 py-4 font-bold text-primary tabular-nums text-xs whitespace-nowrap">
                              {calculateGradingDeadline(row.deadline)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenHomeworkEdit(row)}
                                className="rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors"
                              >
                                Cập nhật
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Step 3: Student Details + BCB + Attendance + RLP Table */
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-xs font-bold text-[#6a5acd] hover:underline"
              >
                ← Quay lại danh sách học viên
              </button>
              <h3 className="text-sm font-extrabold text-zinc-900">{selectedStudent.name}</h3>
            </div>

            {/* Profile Info, BCB Entrance Scores & Cycles History */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Thông tin học viên</h3>
                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Họ và tên</div>
                    <div className="text-sm font-bold text-zinc-900 mt-0.5">{selectedStudent.name}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Số điện thoại</div>
                    <div className="text-zinc-700 mt-0.5">{selectedStudent.phone || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Email</div>
                    <div className="text-zinc-700 break-all mt-0.5">{selectedStudent.email || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Số buổi đã học</div>
                    <div className="text-zinc-800 mt-0.5">{attendanceMetrics.present}/16 buổi</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Hoàn thành bài tập</div>
                    <div className="text-zinc-800 mt-0.5">
                      {(() => {
                        const activeSessions = studentRlp.filter(s => s.no <= 16);
                        const assigned = activeSessions.filter(s => s.homeworkStatus !== "not_assigned").length;
                        const submitted = activeSessions.filter(s => s.homeworkStatus === "submitted" || s.homeworkStatus === "submitted_waiting").length;
                        const pct = assigned > 0 ? Math.round((submitted / assigned) * 100) : 0;
                        return `${pct}% (${submitted}/${assigned} bài)`;
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Bảng chẩn bệnh chi tiết (BCB)</div>
                    <a
                      href={selectedStudent.bcbLink || "/student#bcb-archive"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-bold underline hover:text-primary-hover mt-1 block w-fit"
                    >
                      Mở Bảng Chẩn Bệnh Chi Tiết (BCB) ↗
                    </a>
                  </div>

                  {(() => {
                    const today = new Date(2026, 5, 19); // Friday June 19, 2026
                    const currentDay = today.getDay();
                    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                    const monday = new Date(today);
                    monday.setDate(today.getDate() + distanceToMonday);
                    monday.setHours(0, 0, 0, 0);

                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    sunday.setHours(23, 59, 59, 999);

                    const unsubmittedThisWeek = studentRlp.filter((s) => {
                      if (s.no > 16) return false;
                      if (s.homeworkStatus === "submitted" || s.homeworkStatus === "not_assigned") return false;
                      const p = parseDDMMYYYY(s.date);
                      if (!p) return false;
                      return p >= monday && p <= sunday;
                    });

                    if (unsubmittedThisWeek.length === 0) return null;

                    return (
                      <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-1.5">
                        <div className="text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-rose-500 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                          </svg>
                          Bài tập chưa nộp tuần này:
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-rose-600 font-medium space-y-1 leading-snug">
                          {unsubmittedThisWeek.map((s) => (
                            <li key={s.no} title={s.contents}>
                              Buổi {s.no} ({s.skill}): {s.contents.length > 25 ? s.contents.slice(0, 25) + "..." : s.contents}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* BCB Entrance scores */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Điểm đầu vào (Entrance Test)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["Listening", selectedStudent.scores?.l],
                      ["Reading", selectedStudent.scores?.r],
                      ["Writing", selectedStudent.scores?.w],
                      ["Speaking", selectedStudent.scores?.s],
                    ] as const
                  ).map(([label, val]) => (
                    <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-2.5 text-center">
                      <div className="text-[9px] font-bold uppercase text-zinc-400">{label}</div>
                      <div className="text-sm font-black text-zinc-800 mt-0.5">{val}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                  <div className="text-[9px] font-black uppercase text-primary">Overall Score</div>
                  <div className="text-base font-black text-primary mt-0.5">{selectedStudent.scores?.o}</div>
                </div>
                {selectedStudent.note && (
                  <div className="pt-2 border-t border-zinc-100 text-[10px] font-semibold text-zinc-550 leading-relaxed">
                    <span className="font-bold text-zinc-700">Ghi chú đầu vào:</span> {selectedStudent.note}
                  </div>
                )}
              </div>

              {/* Cycles History Details */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4 overflow-y-auto max-h-[350px] lg:max-h-none">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Lịch sử chặng & dịch vụ</h3>
                <div className="space-y-3">
                  {studentCycles.map((cyc, idx) => {
                    const hasClass = cyc.classCode;
                    if (!hasClass && idx > 0) return null; // Hide empty L2/L3 blocks
                    return (
                      <div key={idx} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 space-y-2">
                        <div className="flex justify-between items-center border-b border-zinc-150 pb-1.5">
                          <span className="text-[9px] font-black uppercase text-secondary">
                            Lần học {idx + 1} (L{idx + 1})
                          </span>
                          {cyc.classCode ? (
                            <div className="flex flex-col items-end gap-1 max-w-[70%]">
                              {cyc.classCode.split('\n').map((line, lIdx) => (
                                <span key={lIdx} className="inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-black text-primary uppercase text-right break-words">
                                  {line.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[8px] text-zinc-400 font-bold uppercase">Chưa xếp lớp</span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold">
                          <div>
                            <div className="text-[8px] text-zinc-400 font-bold uppercase">Chuyên cần</div>
                            <div className="text-zinc-800 font-bold mt-0.5">{cyc.attendanceCount || "—"}</div>
                          </div>
                          <div>
                            <div className="text-[8px] text-zinc-400 font-bold uppercase">Homework</div>
                            <div className="text-zinc-800 font-bold mt-0.5">{cyc.homeworkPercent || "—"}</div>
                          </div>
                           <div>
                            <div className="text-[8px] text-zinc-400 font-bold uppercase">Final</div>
                            <div className="text-primary font-black mt-0.5">
                              {(() => {
                                const s = (cyc.finalScore || "").trim().toUpperCase();
                                if (s === "TRUE") return "Đạt";
                                if (s === "FALSE") return "Chưa đạt";
                                return cyc.finalScore || "—";
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Registered services badges */}
                        <div className="pt-1.5 border-t border-zinc-100 flex flex-wrap gap-1.5">
                          <span className={`inline-flex rounded px-1 px-1 py-0.5 text-[8px] font-bold uppercase ${
                            cyc.registeredWriting ? "bg-emerald-50 text-emerald-700 border border-emerald-250/30" : "bg-zinc-100 text-zinc-400"
                          }`}>
                            Writing: {cyc.registeredWriting ? "Có" : "K"}
                          </span>
                          <span className={`inline-flex rounded px-1 py-0.5 text-[8px] font-bold uppercase ${
                            cyc.registeredMocktest ? "bg-emerald-50 text-emerald-700 border border-emerald-250/30" : "bg-zinc-100 text-zinc-400"
                          }`}>
                            Mock: {cyc.registeredMocktest ? "Có" : "K"}
                          </span>
                          <span className={`inline-flex rounded px-1 py-0.5 text-[8px] font-bold uppercase ${
                            cyc.registeredLuyenDe ? "bg-emerald-50 text-emerald-700 border border-emerald-250/30" : "bg-zinc-100 text-zinc-400"
                          }`}>
                            Đề: {cyc.registeredLuyenDe ? "Có" : "K"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Attendance table */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Bảng điểm danh học sinh</h3>
                <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-lg">
                  Tỷ lệ chuyên cần: {attendanceMetrics.rate}% ({attendanceMetrics.present}/{attendanceMetrics.total} buổi)
                </span>
              </div>
              
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                {studentRlp.slice(0, 16).map((s) => (
                  <div
                    key={s.no}
                    className={`rounded-lg p-2 text-center border text-xs font-bold transition-all ${
                      s.attendance === "present"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                    title={`Buổi ${s.no}: ${s.attendance === "present" ? "Đi học" : "Vắng học"}`}
                  >
                    <div>B{s.no}</div>
                    <div className="text-[8px] opacity-75 mt-0.5">{s.date.slice(0, 5)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RLP Edit Modal */}
        {activeSessionNo !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-premium space-y-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950">
                  Buổi học số {activeSessionNo}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Cập nhật chi tiết kết quả buổi giảng dạy RLP.</p>
              </div>

              <div className="space-y-4">
                {/* Grading Status */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Trạng thái bài tập</label>
                  <NativeSelectChevron
                    value={editStatus === "submitted" ? "graded" : editStatus === "submitted_waiting" ? "waiting" : "pending"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditStatus(val === "graded" ? "submitted" : val === "waiting" ? "submitted_waiting" : "in_progress");
                    }}
                    className="mt-2 h-11 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-foreground shadow-sm"
                  >
                    <option value="graded">Đã chấm</option>
                    <option value="waiting">Đã nộp (Chờ chấm)</option>
                    <option value="pending">Chưa chấm</option>
                  </NativeSelectChevron>
                </div>

                {/* Attendance */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Điểm danh học sinh</label>
                  <NativeSelectChevron
                    value={editAttendance}
                    onChange={(e) => setEditAttendance(e.target.value as Attendance)}
                    className="mt-2 h-11 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-foreground shadow-sm"
                  >
                    <option value="present">Đi học</option>
                    <option value="absent">Vắng học</option>
                  </NativeSelectChevron>
                </div>

                {/* Lesson file link */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Link tài liệu buổi học</label>
                  <input
                    type="url"
                    value={editLessonFile}
                    onChange={(e) => setEditLessonFile(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="mt-2 block w-full h-11 rounded-xl border border-zinc-200 px-3 text-xs outline-none focus:border-primary shadow-sm"
                  />
                </div>

                {/* Homework file link */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Link file bài tập (Google Docs)</label>
                  <input
                    type="url"
                    value={editHomeworkFile}
                    onChange={(e) => setEditHomeworkFile(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="mt-2 block w-full h-11 rounded-xl border border-zinc-200 px-3 text-xs outline-none focus:border-primary shadow-sm"
                  />
                </div>

                {/* Teacher notes */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Ghi chú giáo viên</label>
                  <textarea
                    rows={3}
                    value={editTeacherNote}
                    onChange={(e) => setEditTeacherNote(e.target.value)}
                    placeholder="Ghi chú nhận xét tiến bộ của học viên..."
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-primary shadow-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSessionNo(null)}
                  className="rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 px-4 py-2 text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={savingRlp}
                  onClick={handleSaveRlp}
                  className="rounded-xl bg-primary text-white hover:bg-primary/95 px-5 py-2 text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-60"
                >
                  {savingRlp ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Homework Edit Modal for Class */}
        {homeworkEditSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setHomeworkEditSession(null)}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">Cập Nhật Homework Buổi {homeworkEditSession.no}</span>
                  <h4 className="text-sm font-black text-zinc-900">{homeworkEditSession.skill} — {homeworkEditSession.contents.slice(0, 30)}...</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setHomeworkEditSession(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Link File Bài Tập (Google Drive / OneDrive / URL)
                  </label>
                  <input
                    type="url"
                    value={homeworkFileDraft}
                    onChange={(e) => setHomeworkFileDraft(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1 flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Hạn Nộp Bài Tập (Deadline)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={parseDDMMYYYYtoYYYYMMDD(homeworkDeadlineDraft)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomeworkDeadlineDraft(parseYYYYMMDDtoDDMMYYYY(val));
                      }}
                      className="w-full rounded-xl border border-zinc-200 pl-10 pr-3 py-2 text-xs focus:border-primary focus:outline-none font-semibold text-zinc-800 bg-white cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={handleOpenCalendar}
                      className="absolute left-2 flex items-center justify-center h-7 w-7 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                      title="Bấm để chọn ngày trên lịch"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Ghi Chú & Hướng Dẫn GV Cho Học Viên
                  </label>
                  <textarea
                    value={homeworkNoteDraft}
                    onChange={(e) => setHomeworkNoteDraft(e.target.value)}
                    placeholder="Ví dụ: Làm bài tập 1-3 trong file PDF, thu âm bài nói 2 phút nộp trước 23:59."
                    rows={3}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div className="rounded-xl bg-primary/5 p-3 border border-primary/10 text-[11px] text-zinc-600 font-medium">
                  Lưu ý: Khi cập nhật, thông tin Bài tập về nhà này sẽ tự động được áp dụng và hiển thị cho toàn bộ {classStudents.length} học viên trong lớp.*
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setHomeworkEditSession(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveHomeworkForClass}
                  disabled={homeworkSaving}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-black text-white hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                >
                  {homeworkSaving ? "Đang lưu..." : "Lưu Cập Nhật"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RLP Content Edit Modal for Class */}
        {rlpEditSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setRlpEditSession(null)}
            />
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">Cập Nhật Bảng RLP Buổi {rlpEditSession.no}</span>
                  <h4 className="text-sm font-black text-zinc-900">{rlpEditSession.skill} — Buổi học {rlpEditSession.no}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setRlpEditSession(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Kỹ Năng (Skill)
                  </label>
                  <NativeSelectChevron
                    value={rlpSkillDraft}
                    onChange={(e) => setRlpSkillDraft(e.target.value)}
                    className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-xs font-bold text-zinc-900"
                  >
                    <option value="Speaking">Speaking</option>
                    <option value="Reading">Reading</option>
                    <option value="Writing">Writing</option>
                    <option value="Listening">Listening</option>
                  </NativeSelectChevron>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Nội Dung Bài Học
                  </label>
                  <textarea
                    value={rlpContentsDraft}
                    onChange={(e) => setRlpContentsDraft(e.target.value)}
                    placeholder="Nhập nội dung bài học RLP..."
                    rows={3}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-primary focus:outline-none resize-none font-medium text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Tiến Độ (Ghi Chú Tiến Trình GV)
                  </label>
                  <textarea
                    value={rlpNoteDraft}
                    onChange={(e) => setRlpNoteDraft(e.target.value)}
                    placeholder="Nhập nhận xét / tiến độ học tập của học viên..."
                    rows={2}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-primary focus:outline-none resize-none font-medium text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Link File Bài Học (Google Drive / PDF / Doc)
                  </label>
                  <input
                    type="url"
                    value={rlpLessonFileDraft}
                    onChange={(e) => setRlpLessonFileDraft(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-primary focus:outline-none font-medium text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Link Record Buổi Học (Google Drive / Zoom / Loom / Video URL)
                  </label>
                  <input
                    type="url"
                    value={rlpRecordDraft}
                    onChange={(e) => setRlpRecordDraft(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... hoặc link video record"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-primary focus:outline-none font-medium text-zinc-800"
                  />
                </div>

                <div className="rounded-xl bg-primary/5 p-3 border border-primary/10 text-[11px] text-zinc-600 font-medium">
                  Lưu ý: Khi cập nhật, thông tin RLP này sẽ tự động được áp dụng và hiển thị cho toàn bộ {classStudents.length} học viên trong lớp.*
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setRlpEditSession(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveRlpContentForClass}
                  disabled={rlpSaving}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-black text-white hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                >
                  {rlpSaving ? "Đang lưu..." : "Lưu Cập Nhật RLP"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </TeacherLayout>
  );
}
