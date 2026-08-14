const STORAGE_KEY = "xalo_grader_meet_links_v1";
const GLOBAL_MEET_LINK_KEY = "xalo_global_grader_meet_link_v2";
export const GRADER_MEET_LINKS_EVENT = "xalo_grader_meet_links_updated";

export const DEFAULT_GRADER_MEET_LINKS: Record<string, string> = {
  "Lê Thị Diệu Linh": "https://meet.google.com/dieulinh-speaking-test",
  "Trần Thị Thu Hà": "https://meet.google.com/thuha-speaking-test",
  "Nguyễn Văn An": "https://meet.google.com/vanan-speaking-test",
  "Đỗ Hoài Phương": "https://meet.google.com/hoaiphuong-speaking-test",
  "Phạm Đức Anh": "https://meet.google.com/ducanh-speaking-test",
  "Grader 1": "https://meet.google.com/grader1-speaking-test",
  "Grader 2": "https://meet.google.com/grader2-speaking-test",
  "Grader 3": "https://meet.google.com/grader3-speaking-test",
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
    
    // Always store in global key so any Speaking test link resolves to active custom link
    localStorage.setItem(GLOBAL_MEET_LINK_KEY, cleanLink);

    // Also save aliases so all variations share the link
    const normKey = key.toLowerCase();
    if (normKey.includes("học vụ") || normKey.includes("aca")) {
      next["Bộ phận Học vụ"] = cleanLink;
      next["Bộ phận Học vụ (ACA 2)"] = cleanLink;
      next["Bộ phận Học vụ (ACA 1)"] = cleanLink;
      next["ACA"] = cleanLink;
      next["Quản lý Grader"] = cleanLink;
    }

    // Update in-memory defaults so hardcoded fallbacks immediately return cleanLink
    DEFAULT_GRADER_MEET_LINKS[key] = cleanLink;
    if (normKey.includes("học vụ") || normKey.includes("aca")) {
      DEFAULT_GRADER_MEET_LINKS["Bộ phận Học vụ"] = cleanLink;
      DEFAULT_GRADER_MEET_LINKS["Bộ phận Học vụ (ACA 2)"] = cleanLink;
      DEFAULT_GRADER_MEET_LINKS["Bộ phận Học vụ (ACA 1)"] = cleanLink;
      DEFAULT_GRADER_MEET_LINKS["ACA"] = cleanLink;
      DEFAULT_GRADER_MEET_LINKS["Quản lý Grader"] = cleanLink;
      DEFAULT_GRADER_MEET_LINKS["Grader"] = cleanLink;
      DEFAULT_GRADER_MEET_LINKS["GV Speaking"] = cleanLink;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(GRADER_MEET_LINKS_EVENT));
  } catch {
    // ignore
  }
}

export function getGraderMeetLink(teacherName?: string | null): string {
  // 1. If ANY custom link was saved in localStorage, return that active custom link immediately!
  if (typeof window !== "undefined") {
    const globalCustom = localStorage.getItem(GLOBAL_MEET_LINK_KEY);
    if (globalCustom && globalCustom.trim()) {
      return globalCustom.trim();
    }
  }

  const saved = getSavedUserLinks();
  const savedValues = Object.values(saved).filter(Boolean);

  // 2. Check direct match in saved user links
  if (teacherName && teacherName.trim()) {
    const trimmed = teacherName.trim();
    if (saved[trimmed]) return saved[trimmed];

    const lower = trimmed.toLowerCase();
    for (const [name, link] of Object.entries(saved)) {
      const nameLower = name.toLowerCase();
      if (
        nameLower === lower ||
        lower.includes(nameLower) ||
        nameLower.includes(lower) ||
        (lower.includes("học vụ") && nameLower.includes("học vụ")) ||
        (lower.includes("aca") && nameLower.includes("aca"))
      ) {
        return link;
      }
    }
  }

  // 3. Fallback to latest saved value if available
  if (savedValues.length > 0) {
    return savedValues[savedValues.length - 1];
  }

  // 4. Fallback to default hardcoded links if no custom link was ever saved
  if (teacherName && teacherName.trim()) {
    const trimmed = teacherName.trim();
    const lower = trimmed.toLowerCase();
    const all = DEFAULT_GRADER_MEET_LINKS;
    if (all[trimmed]) return all[trimmed];

    for (const [name, link] of Object.entries(all)) {
      const nameLower = name.toLowerCase();
      if (nameLower === lower || lower.includes(nameLower) || nameLower.includes(lower)) {
        return link;
      }
    }

    const slug = trimmed
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    return `https://meet.google.com/${slug || "xalo"}-speaking-test`;
  }

  return "https://meet.google.com/xalo-speaking-test";
}
