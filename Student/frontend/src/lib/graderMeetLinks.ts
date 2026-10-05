import { canUseAcaApi, getAcaKv, mergeAcaKv } from "@/lib/acaManagementApi";

const STORAGE_KEY = "xalo_grader_meet_links_v1";
const GLOBAL_MEET_LINK_KEY = "xalo_global_grader_meet_link_v2";
export const GRADER_MEET_LINKS_EVENT = "xalo_grader_meet_links_updated";
const KV_NAMESPACE = "graderMeetLinks";

export const DEFAULT_GRADER_MEET_LINKS: Record<string, string> = {
  "Huỳnh Gia Phú": "https://meet.google.com/giaphu-speaking-test",
  "Lê Thị Diệu Linh": "https://meet.google.com/dieulinh-speaking-test",
  "Nguyễn Văn Đăng Duy": "https://meet.google.com/dangduy-speaking-test",
  "Huỳnh Minh Phương": "https://meet.google.com/minhphuong-speaking-test",
  "Nguyễn Thị Hoàng Sa": "https://meet.google.com/hoangsa-speaking-test",
  "Gia Phú": "https://meet.google.com/giaphu-speaking-test",
  "Diệu Linh": "https://meet.google.com/dieulinh-speaking-test",
  "Đăng Duy": "https://meet.google.com/dangduy-speaking-test",
  "Trần Thị Thu Hà": "https://meet.google.com/thuha-speaking-test",
  "Nguyễn Văn An": "https://meet.google.com/vanan-speaking-test",
  "Đỗ Hoài Phương": "https://meet.google.com/hoaiphuong-speaking-test",
  "Phạm Đức Anh": "https://meet.google.com/ducanh-speaking-test",
  "Grader 1": "https://meet.google.com/giaphu-speaking-test",
  "Bộ phận Grader 1": "https://meet.google.com/giaphu-speaking-test",
  "Grader 2": "https://meet.google.com/dieulinh-speaking-test",
  "Bộ phận Grader 2": "https://meet.google.com/dieulinh-speaking-test",
  "Grader 3": "https://meet.google.com/dangduy-speaking-test",
  "Bộ phận Grader 3": "https://meet.google.com/dangduy-speaking-test",
  "Quản lý Grader": "https://meet.google.com/hih-aaa-aie",
  "Lê Nguyễn Khánh Thi": "https://meet.google.com/khanhthi-speaking-test",
  "Nghiêm Doãn Quỳnh Châu": "https://meet.google.com/quynhchau-speaking-test",
  "Tất Duy Khải": "https://meet.google.com/duykhai-speaking-test",
  "Thái Đỗ Đăng Khoa": "https://meet.google.com/dangkhoa-speaking-test",
  "Bộ phận Học vụ (ACA 2)": "https://meet.google.com/hih-aaa-aie",
  "Bộ phận Học vụ (ACA 1)": "https://meet.google.com/hih-aaa-aie",
  "Bộ phận Học vụ": "https://meet.google.com/hih-aaa-aie",
  "Grader": "https://meet.google.com/hih-aaa-aie",
  "GV Speaking": "https://meet.google.com/hih-aaa-aie",
};

export const GRADER_MEET_LINKS = DEFAULT_GRADER_MEET_LINKS;

function getSavedUserLinks(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function getAllGraderMeetLinks(): Record<string, string> {
  const saved = getSavedUserLinks();
  return { ...DEFAULT_GRADER_MEET_LINKS, ...saved };
}

export function saveGraderMeetLink(teacherName: string, link: string): void {
  if (typeof window === "undefined" || !teacherName.trim()) return;
  try {
    const saved = getSavedUserLinks();
    const key = teacherName.trim();
    const cleanLink = link.trim();
    if (!cleanLink) return;

    const next = { ...saved, [key]: cleanLink };

    const normKey = key.toLowerCase();
    if (normKey.includes("grader 1")) {
      next["Grader 1"] = cleanLink;
      next["Bộ phận Grader 1"] = cleanLink;
    } else if (normKey.includes("grader 2")) {
      next["Grader 2"] = cleanLink;
      next["Bộ phận Grader 2"] = cleanLink;
    } else if (normKey.includes("grader 3")) {
      next["Grader 3"] = cleanLink;
      next["Bộ phận Grader 3"] = cleanLink;
    } else if (normKey.includes("học vụ") || normKey.includes("aca")) {
      next["Bộ phận Học vụ"] = cleanLink;
      next["Bộ phận Học vụ (ACA 2)"] = cleanLink;
      next["Bộ phận Học vụ (ACA 1)"] = cleanLink;
      next["ACA"] = cleanLink;
    }

    DEFAULT_GRADER_MEET_LINKS[key] = cleanLink;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(GRADER_MEET_LINKS_EVENT));

    // Persist to backend KV store (fire-and-forget)
    if (canUseAcaApi()) {
      void mergeAcaKv(KV_NAMESPACE, next as Record<string, unknown>).catch(() => {});
    }
  } catch {
    // ignore
  }
}

/** Load grader meet links từ API và merge vào in-memory + localStorage */
export async function syncGraderMeetLinksFromBackend(): Promise<void> {
  if (!canUseAcaApi()) return;
  try {
    const data = await getAcaKv(KV_NAMESPACE);
    if (!data || Object.keys(data).length === 0) return;
    const current = getSavedUserLinks();
    const merged = { ...current, ...(data as Record<string, string>) };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      // Update in-memory defaults
      for (const [k, v] of Object.entries(merged)) {
        if (typeof v === "string") DEFAULT_GRADER_MEET_LINKS[k] = v;
      }
      window.dispatchEvent(new Event(GRADER_MEET_LINKS_EVENT));
    }
  } catch {
    // ignore
  }
}

export function getGraderMeetLink(teacherName?: string | null): string {
  if (!teacherName || !teacherName.trim()) {
    return DEFAULT_GRADER_MEET_LINKS["Bộ phận Học vụ"] || "https://meet.google.com/hih-aaa-aie";
  }

  const trimmed = teacherName.trim();
  const lower = trimmed.toLowerCase();
  const saved = getSavedUserLinks();

  // 1. Exact match in saved user links
  if (saved[trimmed]) return saved[trimmed];

  // 2. Case-insensitive / normalized match in saved user links
  for (const [name, link] of Object.entries(saved)) {
    const nameLower = name.toLowerCase();
    if (nameLower === lower) return link;
    if (lower.includes(nameLower) || nameLower.includes(lower)) return link;
  }

  // 3. Exact match in DEFAULT_GRADER_MEET_LINKS
  if (DEFAULT_GRADER_MEET_LINKS[trimmed]) {
    return DEFAULT_GRADER_MEET_LINKS[trimmed];
  }

  // 4. Case-insensitive / substring match in DEFAULT_GRADER_MEET_LINKS
  for (const [name, link] of Object.entries(DEFAULT_GRADER_MEET_LINKS)) {
    const nameLower = name.toLowerCase();
    if (nameLower === lower) return link;
    if (lower.includes(nameLower) || nameLower.includes(lower)) return link;
  }

  // 5. Special keyword matching
  if (lower.includes("grader 1") || lower.includes("gia phú") || lower.includes("gia phu")) return DEFAULT_GRADER_MEET_LINKS["Huỳnh Gia Phú"];
  if (lower.includes("grader 2") || lower.includes("diệu linh") || lower.includes("dieu linh")) return DEFAULT_GRADER_MEET_LINKS["Lê Thị Diệu Linh"];
  if (lower.includes("grader 3") || lower.includes("đăng duy") || lower.includes("dang duy")) return DEFAULT_GRADER_MEET_LINKS["Nguyễn Văn Đăng Duy"];
  if (lower.includes("minh phương") || lower.includes("minh phuong")) return DEFAULT_GRADER_MEET_LINKS["Huỳnh Minh Phương"];
  if (lower.includes("hoàng sa") || lower.includes("hoang sa")) return DEFAULT_GRADER_MEET_LINKS["Nguyễn Thị Hoàng Sa"];
  if (lower.includes("thu hà") || lower.includes("thu ha")) return DEFAULT_GRADER_MEET_LINKS["Trần Thị Thu Hà"];
  if (lower.includes("văn an") || lower.includes("van an")) return DEFAULT_GRADER_MEET_LINKS["Nguyễn Văn An"];
  if (lower.includes("hoài phương") || lower.includes("hoai phuong")) return DEFAULT_GRADER_MEET_LINKS["Đỗ Hoài Phương"];
  if (lower.includes("đức anh") || lower.includes("duc anh")) return DEFAULT_GRADER_MEET_LINKS["Phạm Đức Anh"];
  if (lower.includes("khánh thi") || lower.includes("khanh thi")) return DEFAULT_GRADER_MEET_LINKS["Lê Nguyễn Khánh Thi"];
  if (lower.includes("quỳnh châu") || lower.includes("quynh chau")) return DEFAULT_GRADER_MEET_LINKS["Nghiêm Doãn Quỳnh Châu"];
  if (lower.includes("duy khải") || lower.includes("duy khai")) return DEFAULT_GRADER_MEET_LINKS["Tất Duy Khải"];
  if (lower.includes("đăng khoa") || lower.includes("dang khoa")) return DEFAULT_GRADER_MEET_LINKS["Thái Đỗ Đăng Khoa"];

  // Fallback default
  return "https://meet.google.com/hih-aaa-aie";
}
