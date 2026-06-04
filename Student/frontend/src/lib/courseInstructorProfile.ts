import { getPortalProfile, PORTAL_PROFILE_UPDATE_EVENT } from "@/lib/portalProfile";

export type InstructorPublicProfile = {
  name: string;
  title: string;
  email: string;
  phone: string;
  ieltsBand: string;
  specialties: string[];
  experience: string;
  certifications: string[];
  bio: string;
};

const EXTRA_BY_NAME: Record<string, Omit<InstructorPublicProfile, "name" | "title" | "email" | "phone">> = {
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

const FALLBACK_EXTRA: Omit<InstructorPublicProfile, "name" | "title" | "email" | "phone"> = {
  ieltsBand: "—",
  specialties: ["IELTS tổng quát"],
  experience: "—",
  certifications: [],
  bio: "Thông tin chi tiết sẽ được cập nhật bởi trung tâm.",
};

export function resolveInstructorPublicProfile(instructorName: string): InstructorPublicProfile {
  const name = instructorName.trim() || "—";
  const gv = getPortalProfile("gv");
  const extra = EXTRA_BY_NAME[name] ?? FALLBACK_EXTRA;

  const useGvContact = gv.name.trim() === name;

  return {
    name: useGvContact ? gv.name : name,
    title: useGvContact ? gv.title : "Giáo viên IELTS",
    email: useGvContact ? gv.email : "—",
    phone: useGvContact ? gv.phone : "—",
    ...extra,
  };
}

export { PORTAL_PROFILE_UPDATE_EVENT };
