/** Dữ liệu demo ACA — chỉ cho UI */

export const dashboardKpis = {
  totalDocuments: 1842,
  totalUsers: 3126,
  docViewsWeek: 48_200,
  avgSessionMin: 12.4,
};

export const popularDocuments = [
  { id: "1", title: "Reading Strategy — T/F/NG", views: 12800 },
  { id: "2", title: "Writing Task 2 — Idea Bank", views: 9600 },
  { id: "3", title: "Listening Map — Note taking", views: 8900 },
  { id: "4", title: "Vocabulary Theme: Education", views: 7200 },
];

export const accessBySubject = [
  { subject: "Đọc", pct: 28 },
  { subject: "Viết", pct: 24 },
  { subject: "Nghe", pct: 22 },
  { subject: "Nói", pct: 16 },
  { subject: "Khác", pct: 10 },
];

export const usageTrendLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const usageTrendValues = [42, 55, 48, 61, 58, 35, 28];

export const newContentWeek = [
  { id: "n1", title: "Grammar Collocation Drill", category: "Từ vựng", when: "2 giờ trước" },
  { id: "n2", title: "Mock Test Listening 12", category: "Nghe", when: "Hôm qua" },
  { id: "n3", title: "Solidifying Orientation v2", category: "Hướng dẫn", when: "3 ngày trước" },
];

export type ContentStatus = "draft" | "pending" | "published" | "hidden";

export type ContentRow = {
  id: string;
  title: string;
  category: string;
  status: ContentStatus;
  updatedAt: string;
};

export const contentRows: ContentRow[] = [
  {
    id: "c1",
    title: "Advanced Reading Pack",
    category: "Đọc",
    status: "pending",
    updatedAt: "2026-05-04",
  },
  {
    id: "c2",
    title: "Speaking Part 2 Scripts",
    category: "Nói",
    status: "published",
    updatedAt: "2026-05-01",
  },
  {
    id: "c3",
    title: "Deprecated placement test",
    category: "Khác",
    status: "hidden",
    updatedAt: "2026-04-20",
  },
  {
    id: "c4",
    title: "Writing Feedback Template",
    category: "Viết",
    status: "draft",
    updatedAt: "2026-05-05",
  },
];

export type Role = "HS" | "GV" | "ACA";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  locked: boolean;
};

export const userRows: UserRow[] = [
  { id: "u1", name: "Dương Ngọc Khôi Nguyên", email: "stu1@demo.test", role: "HS", locked: false },
  { id: "u2", name: "Cô Minh Trang", email: "gv1@demo.test", role: "GV", locked: false },
  { id: "u3", name: "Admin ACA", email: "aca@demo.test", role: "ACA", locked: false },
  { id: "u4", name: "Spam Account", email: "spam@test", role: "HS", locked: true },
];

export function contentStatusVi(s: ContentStatus) {
  if (s === "draft") return "Nháp";
  if (s === "pending") return "Chờ duyệt";
  if (s === "published") return "Đã hiển thị";
  return "Đã ẩn";
}

export function roleLabel(r: Role) {
  if (r === "HS") return "Học sinh";
  if (r === "GV") return "Giáo viên";
  return "ACA";
}

export const analyticsSnapshot = {
  totalViewsPeriod: 128_900,
  totalMinutesPeriod: 384_600,
  topTitle: popularDocuments[0].title,
  lowTitle: "Legacy quiz pack 2019",
  dropoffHint: "Video «Intro IELTS» — 34% thoát sau 02:30",
};

export const subjectComparison = [
  { subject: "Đọc", views: 36_000, minutes: 98_400 },
  { subject: "Viết", views: 28_500, minutes: 112_300 },
  { subject: "Nghe", views: 31_200, minutes: 78_900 },
  { subject: "Nói", views: 19_800, minutes: 45_600 },
];

export const systemCategories = ["IELTS", "Từ vựng", "Hướng dẫn", "Luyện đề", "Nội bộ"];

export const systemTags = ["beginner", "intermediate", "pdf", "video", "archived"];
