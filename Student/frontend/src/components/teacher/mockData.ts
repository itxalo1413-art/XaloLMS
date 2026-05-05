export type StudentStatus = "active" | "follow_up" | "paused";

export type StudentSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: string;
  status: StudentStatus;
  overallBand?: string;
  learningSummary: string;
};

export type SkillScores = {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
};

export type TimelineEntry = {
  id: string;
  kind: "comment" | "update";
  date: string;
  label: string;
  detail: string;
  skill?: string;
};

export const students: StudentSummary[] = [
  {
    id: "hs-01",
    name: "Dương Ngọc Khôi Nguyên",
    email: "nguyenduong939705@gmail.com",
    phone: "0947 188 794",
    group: "Solidifying — T357",
    status: "active",
    overallBand: "6.0",
    learningSummary: "Viết và Nói cần củng cố; Nghe/Đọc ổn định.",
  },
  {
    id: "hs-02",
    name: "Bùi Phạm Diệu Linh",
    email: "linh.bp@example.com",
    phone: "0903 000 000",
    group: "Luyện đề online",
    status: "follow_up",
    overallBand: "5.5",
    learningSummary: "Cần theo dõi tiến độ làm đề tuần này.",
  },
  {
    id: "hs-03",
    name: "Trần Minh An",
    email: "minhan.t@example.com",
    phone: "0912 345 678",
    group: "Solidifying — T357",
    status: "active",
    overallBand: "7.0",
    learningSummary: "Ổn định toàn kỹ năng; ưu tiên tinh chỉnh Speaking.",
  },
  {
    id: "hs-04",
    name: "Lê Hoàng Nam",
    email: "nam.lh@example.com",
    phone: "0987 654 321",
    group: "Kèm Writing",
    status: "paused",
    overallBand: "5.0",
    learningSummary: "Tạm nghỉ — ghi chú học vụ đã lưu.",
  },
];

export const studentScores: Record<string, SkillScores> = {
  "hs-01": { listening: 7.5, reading: 5.5, writing: 6.0, speaking: 4.5 },
  "hs-02": { listening: 6.0, reading: 5.5, writing: 5.0, speaking: 5.0 },
  "hs-03": { listening: 7.0, reading: 7.0, writing: 6.5, speaking: 6.5 },
  "hs-04": { listening: 5.0, reading: 5.5, writing: 5.0, speaking: 4.5 },
};

export const recentActivityByStudent: Record<string, string[]> = {
  "hs-01": [
    "Đã xem tài liệu Reading strategy (3 ngày trước)",
    "Nộp bài Writing task 2 — đang chờ chấm",
  ],
  "hs-02": ["Tham gia buổi sửa đề Writing — Thứ 3", "Mock Speaking — đã xếp lịch"],
  "hs-03": ["Hoàn thành bài Listening practice", "Đăng ký mock test Speaking"],
  "hs-04": ["Không có hoạt động trong 14 ngày gần đây"],
};

export const internalNotesByStudent: Record<string, string> = {
  "hs-01": "Nhạy với feedback ngắn; nên nhắc ôn collocations cho Writing.",
  "hs-02": "Hay trễ deadline Zalo nhóm — đã nhắc học vụ.",
  "hs-03": "Học viên chủ động cao.",
  "hs-04": "Chờ xác nhận lịch quay lại lớp.",
};

export const timelineByStudent: Record<string, TimelineEntry[]> = {
  "hs-01": [
    {
      id: "t1",
      kind: "comment",
      date: "2026-05-02",
      label: "Nhận xét Speaking",
      detail: "Cần mở rộng ý Part 3, tránh lặp cấu trúc.",
      skill: "Speaking",
    },
    {
      id: "t2",
      kind: "update",
      date: "2026-04-28",
      label: "Cập nhật năng lực",
      detail: "Nhận định: Reading ổn; Writing task 2 cần outline rõ hơn.",
    },
    {
      id: "t3",
      kind: "comment",
      date: "2026-04-20",
      label: "Nhận xét Writing",
      detail: "Bài có ý nhưng kết nối đoạn yếu.",
      skill: "Writing",
    },
  ],
  "hs-02": [
    {
      id: "t1",
      kind: "comment",
      date: "2026-05-01",
      label: "Nhận xét Listening",
      detail: "Map labeling cần luyện thêm.",
      skill: "Listening",
    },
  ],
  "hs-03": [],
  "hs-04": [
    {
      id: "t1",
      kind: "update",
      date: "2026-03-15",
      label: "Cập nhật trạng thái",
      detail: "Học viên xin tạm dừng 1 tháng.",
    },
  ],
};

export function getStudent(id: string) {
  return students.find((s) => s.id === id) ?? null;
}

export function statusLabel(s: StudentStatus) {
  if (s === "active") return "Đang học";
  if (s === "follow_up") return "Cần theo dõi";
  return "Tạm dừng";
}
