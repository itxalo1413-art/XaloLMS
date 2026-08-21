import { fetchAcaTeacherProfiles } from "@/lib/acaManagementApi";

/**
 * Danh sách Grader mặc định khi API chưa sẵn sàng.
 */
export const DEFAULT_MOCK_TEST_TEACHER_OPTIONS = [
  "Grader 1",
  "Grader 2",
  "Quản lý Grader",
  "Grader Hệ thống",
  "Lê Nguyễn Khánh Thi",
  "Lê Thị Diệu Linh",
  "Nghiêm Doãn Quỳnh Châu",
  "Lê Minh Trang",
  "Phạm Hoàng An",
  "Trần Thu Lan",
  "Grader",
] as const;

export const MOCK_TEST_TEACHER_OPTIONS = DEFAULT_MOCK_TEST_TEACHER_OPTIONS;
export const MOCK_TEST_TEACHER_OPTIONS_EVENT = "xalo-mock-test-teacher-options-updated";

let teacherOptionsCache: string[] = [...DEFAULT_MOCK_TEST_TEACHER_OPTIONS];

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MOCK_TEST_TEACHER_OPTIONS_EVENT));
}

function normalizeTeacherOptions(names: string[]): string[] {
  const seen = new Set<string>();
  const normalized = names
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return normalized.length > 0 ? normalized : [...DEFAULT_MOCK_TEST_TEACHER_OPTIONS];
}

export function getMockTestTeacherOptions(): string[] {
  return teacherOptionsCache.length > 0
    ? teacherOptionsCache
    : [...DEFAULT_MOCK_TEST_TEACHER_OPTIONS];
}

export async function syncMockTestTeacherOptions(): Promise<string[]> {
  try {
    const profiles = await fetchAcaTeacherProfiles();
    const activeTeachers = profiles
      .filter((profile) => profile.status !== "inactive")
      .map((profile) => profile.name);
    teacherOptionsCache = normalizeTeacherOptions([
      ...DEFAULT_MOCK_TEST_TEACHER_OPTIONS,
      ...activeTeachers,
    ]);
    dispatchUpdate();
  } catch (err) {
    console.warn("Could not sync mock test teacher options", err);
  }
  return getMockTestTeacherOptions();
}
