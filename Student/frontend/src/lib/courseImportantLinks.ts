import { apiFetch, getAuthToken, getCachedAuthUser } from "@/lib/auth";

export type CourseImportantLink = {
  id: string;
  label: string;
  value: string;
  url: string;
};

/** Chỉ dùng khi ACA soạn course-settings offline — không seed tên học viên giả. */
export const DEFAULT_COURSE_IMPORTANT_LINKS: CourseImportantLink[] = [
  {
    id: "rlp",
    label: "RLP",
    value: "",
    url: "#rlp-section",
  },
  {
    id: "lesson",
    label: "THƯ MỤC BÀI GIẢNG",
    value: "",
    url: "",
  },
  {
    id: "homework",
    label: "THƯ MỤC BÀI TẬP",
    value: "",
    url: "",
  },
  {
    id: "survey",
    label: "KHẢO SÁT HỌC VIÊN",
    value: "—",
    url: "",
  },
];

const STORAGE_KEY = "xalo.course.importantLinks.v2";
export const COURSE_IMPORTANT_LINKS_UPDATE_EVENT = "xalo-course-important-links-updated";

let cache: CourseImportantLink[] = [];
let activeClassId = "";
let studentLinksListenerBound = false;

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COURSE_IMPORTANT_LINKS_UPDATE_EVENT));
}

function isStudentPortalUser(): boolean {
  const role = getCachedAuthUser()?.role;
  return role === "HS" || (!role && Boolean(getAuthToken()));
}

function loadLocal(): CourseImportantLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as CourseImportantLink[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getCourseImportantLinks(): CourseImportantLink[] {
  return cache;
}

export function setActiveCourseClassId(classId: string) {
  activeClassId = String(classId || "").trim();
}

export function saveCourseImportantLinks(links: CourseImportantLink[]): CourseImportantLink[] {
  cache = links;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    dispatchUpdate();
    const body: Record<string, unknown> = { links };
    if (activeClassId) body.classId = activeClassId;
    void apiFetch("/api/aca/course-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((err) => console.warn("Failed to persist course links to backend", err));
  }
  return cache;
}

export function refreshCourseImportantLinks(): CourseImportantLink[] {
  if (typeof window === "undefined") return cache;

  // Học viên: links đến từ class-info (event), không gọi global course-settings
  if (getAuthToken() && isStudentPortalUser()) {
    if (!studentLinksListenerBound) {
      studentLinksListenerBound = true;
      window.addEventListener("xalo-student-class-links", ((ev: Event) => {
        const detail = (ev as CustomEvent<CourseImportantLink[]>).detail;
        if (Array.isArray(detail)) {
          cache = detail;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(detail));
          dispatchUpdate();
        }
      }) as EventListener);
    }
    return cache;
  }

  const qs = activeClassId ? `?classId=${encodeURIComponent(activeClassId)}` : "";
  void apiFetch(`/api/aca/course-settings${qs}`, { method: "GET" })
    .then((res) => res.json())
    .then((data) => {
      if (data && Array.isArray(data.links) && data.links.length > 0) {
        cache = data.links;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.links));
        dispatchUpdate();
      } else if (getAuthToken()) {
        cache = [];
        dispatchUpdate();
      }
    })
    .catch(() => {
      cache = loadLocal();
      dispatchUpdate();
    });
  return cache;
}

if (typeof window !== "undefined") {
  cache = loadLocal();
  refreshCourseImportantLinks();
}
