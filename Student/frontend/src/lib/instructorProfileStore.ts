import type { InstructorPublicProfile } from "@/lib/courseInstructorProfile";

export type InstructorProfileExtra = Omit<
  InstructorPublicProfile,
  "name" | "title" | "email" | "phone"
>;

export const DEFAULT_INSTRUCTOR_PROFILES: Record<string, InstructorProfileExtra> = {
  "Nghiêm Doãn Quỳnh Châu": {
    ieltsBand: "8.0",
    specialties: ["Listening", "Reading", "Writing", "Speaking"],
    experience: "5+ năm giảng dạy IELTS offline & online",
    certifications: ["CELTA", "Chứng chỉ đào tạo giáo viên Xa Lộ English"],
    bio: "Chuyên đồng hành học viên từ mức 5.5–6.5 lên 7.0+, tập trung chẩn đoán lỗi theo BCB và lộ trình may đo.",
  },
  "Lê Minh Trang": {
    ieltsBand: "8.0",
    specialties: ["Speaking", "Writing"],
    experience: "5 năm coaching Speaking mock test",
    certifications: ["IELTS Trainer"],
    bio: "Ưu tiên phản hồi chi tiết Speaking Part 2–3 và chữa Writing Task 2.",
  },
  "Phạm Hoàng An": {
    ieltsBand: "8.0",
    specialties: ["Listening", "Reading"],
    experience: "6 năm luyện đề Actual Test",
    certifications: ["TESOL"],
    bio: "Hỗ trợ chiến lược làm bài nhanh và phân tích đề theo xu hướng ra đề gần nhất.",
  },
  "Trần Thu Lan": {
    ieltsBand: "7.5",
    specialties: ["Writing", "Grammar"],
    experience: "4 năm chấm–chữa Writing",
    certifications: ["IELTS Writing Specialist"],
    bio: "Tập trung rubric Writing Task 1–2 và sửa lỗi ngữ pháp theo chuyên đề.",
  },
};

const STORAGE_KEY = "xalo.instructor.profiles.v1";
export const INSTRUCTOR_PROFILES_UPDATE_EVENT = "xalo-instructor-profiles-updated";

let cache: Record<string, InstructorProfileExtra> = {
  ...DEFAULT_INSTRUCTOR_PROFILES,
};

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INSTRUCTOR_PROFILES_UPDATE_EVENT));
}

function loadLocal(): Record<string, InstructorProfileExtra> {
  if (typeof window === "undefined") return { ...DEFAULT_INSTRUCTOR_PROFILES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_INSTRUCTOR_PROFILES };
    const data = JSON.parse(raw) as Record<string, InstructorProfileExtra>;
    return { ...DEFAULT_INSTRUCTOR_PROFILES, ...data };
  } catch {
    return { ...DEFAULT_INSTRUCTOR_PROFILES };
  }
}

export function getInstructorProfileExtras(): Record<string, InstructorProfileExtra> {
  if (typeof window !== "undefined") {
    cache = loadLocal();
  }
  return cache;
}

export function getInstructorProfileExtra(name: string): InstructorProfileExtra | undefined {
  return getInstructorProfileExtras()[name.trim()];
}

export function saveInstructorProfileExtra(
  name: string,
  extra: InstructorProfileExtra,
): Record<string, InstructorProfileExtra> {
  cache = { ...getInstructorProfileExtras(), [name.trim()]: extra };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    dispatchUpdate();
  }
  return cache;
}

export function refreshInstructorProfileExtras(): Record<string, InstructorProfileExtra> {
  cache = loadLocal();
  dispatchUpdate();
  return cache;
}

if (typeof window !== "undefined") {
  cache = loadLocal();
}
