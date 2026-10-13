import {
  fetchAcaTeacherProfiles,
  fetchAcaFreeSlots,
  fetchAcaGraders,
} from "@/lib/acaManagementApi";
import { XALO_GV_NAMES } from "@/lib/xaloTeacherRoster";

/**
 * Danh sách Grader chuẩn (CHỈ gồm bộ phận Grader, TUYỆT ĐỐI KHÔNG gồm Giáo viên và ACA).
 */
export const DEFAULT_GRADER_OPTIONS = [
  "Huỳnh Gia Phú",
  "Lê Thị Diệu Linh",
  "Nguyễn Văn Đăng Duy",
  "Huỳnh Minh Phương",
  "Nguyễn Thị Hoàng Sa",
] as const;

/**
 * Danh sách Giáo viên chuẩn (dành riêng cho các ca Speaking / GV đứng lớp).
 */
export const DEFAULT_TEACHER_OPTIONS = [...XALO_GV_NAMES] as readonly string[];

export const DEFAULT_MOCK_TEST_TEACHER_OPTIONS = DEFAULT_GRADER_OPTIONS;
export const MOCK_TEST_TEACHER_OPTIONS = DEFAULT_GRADER_OPTIONS;

export const GRADER_OPTIONS_EVENT = "xalo-grader-options-updated";
export const MOCK_TEST_TEACHER_OPTIONS_EVENT = "xalo-mock-test-teacher-options-updated";

// Danh sách tên GV / ACA cần loại bỏ triệt để khỏi danh sách Grader
const EXCLUDED_NON_GRADER_NAMES = new Set([
  ...XALO_GV_NAMES.map((n) => n.toLowerCase()),
  "lê thanh tâm",
  "đặng duy",
  "bộ phận học vụ (aca)",
  "bộ phận học vụ",
  "học vụ",
  "aca",
  "sale",
]);

let graderOptionsCache: string[] = [];
let teacherOptionsCache: string[] = [];

function dispatchGraderUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GRADER_OPTIONS_EVENT));
  window.dispatchEvent(new Event(MOCK_TEST_TEACHER_OPTIONS_EVENT));
}

function normalizeUniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function isGraderName(name?: string | null): boolean {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  if (EXCLUDED_NON_GRADER_NAMES.has(clean)) return false;
  return clean.includes("grader") || DEFAULT_GRADER_OPTIONS.some((g) => g.toLowerCase() === clean);
}

/**
 * Lấy danh sách Grader (chỉ Grader, không có GV hoặc ACA).
 */
export function getGraderOptions(): string[] {
  return graderOptionsCache.length > 0
    ? graderOptionsCache
    : [...DEFAULT_GRADER_OPTIONS];
}

export const getMockTestGraderOptions = getGraderOptions;

/**
 * Đồng bộ danh sách Grader từ server (fetch các tài khoản role=GRADER).
 */
export async function syncGraderOptions(): Promise<string[]> {
  try {
    const [graderUsers, slots] = await Promise.all([
      fetchAcaGraders().catch(() => []),
      fetchAcaFreeSlots().catch(() => []),
    ]);

    // Lọc user có role GRADER hoặc name có chữ Grader, loại bỏ GV/ACA
    const apiGraders = graderUsers
      .filter((u) => u.status !== "INACTIVE")
      .map((u) => u.name)
      .filter(isGraderName);

    const slotGraders = slots
      .map((s) => s.teacherName)
      .filter((name): name is string => Boolean(name) && isGraderName(name));

    const combined = [
      ...apiGraders,
      ...slotGraders,
      ...DEFAULT_GRADER_OPTIONS,
    ].filter(isGraderName);

    const normalized = normalizeUniqueNames(combined);
    graderOptionsCache =
      normalized.length > 0 ? normalized : [...DEFAULT_GRADER_OPTIONS];
    dispatchGraderUpdate();
  } catch (err) {
    console.warn("Could not sync grader options", err);
  }
  return getGraderOptions();
}

export const syncMockTestGraderOptions = syncGraderOptions;

/**
 * Backward compatibility alias: getMockTestTeacherOptions now defaults to Grader options if used in grading context
 */
export function getMockTestTeacherOptions(): string[] {
  return getGraderOptions();
}

export async function syncMockTestTeacherOptions(): Promise<string[]> {
  return syncGraderOptions();
}
