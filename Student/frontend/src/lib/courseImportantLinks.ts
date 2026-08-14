export type CourseImportantLink = {
  id: string;
  label: string;
  value: string;
  url: string;
};

export const DEFAULT_COURSE_IMPORTANT_LINKS: CourseImportantLink[] = [
  {
    id: "rlp",
    label: "RLP",
    value: "Chặng 1: Speaking - Reading",
    url: "#rlp-section",
  },
  {
    id: "lesson",
    label: "THƯ MỤC BÀI GIẢNG",
    value: "Writing - Listening (21/04/2026)",
    url: "",
  },
  {
    id: "homework",
    label: "THƯ MỤC BÀI TẬP",
    value: "HW Dương Ngọc Khôi Nguyên",
    url: "",
  },
  {
    id: "survey",
    label: "KHẢO SÁT HỌC VIÊN",
    value: "—",
    url: "",
  },
];

const STORAGE_KEY = "xalo.course.importantLinks.v1";
export const COURSE_IMPORTANT_LINKS_UPDATE_EVENT = "xalo-course-important-links-updated";

let cache: CourseImportantLink[] = DEFAULT_COURSE_IMPORTANT_LINKS.map((l) => ({ ...l }));

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COURSE_IMPORTANT_LINKS_UPDATE_EVENT));
}

function loadLocal(): CourseImportantLink[] {
  if (typeof window === "undefined") return DEFAULT_COURSE_IMPORTANT_LINKS.map((l) => ({ ...l }));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COURSE_IMPORTANT_LINKS.map((l) => ({ ...l }));
    const data = JSON.parse(raw) as CourseImportantLink[];
    return data.length ? data : DEFAULT_COURSE_IMPORTANT_LINKS.map((l) => ({ ...l }));
  } catch {
    return DEFAULT_COURSE_IMPORTANT_LINKS.map((l) => ({ ...l }));
  }
}

import { apiFetch } from "@/lib/auth";

export function getCourseImportantLinks(): CourseImportantLink[] {
  if (typeof window !== "undefined" && cache === DEFAULT_COURSE_IMPORTANT_LINKS) {
    cache = loadLocal();
  }
  return cache;
}

export function saveCourseImportantLinks(links: CourseImportantLink[]): CourseImportantLink[] {
  cache = links;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    dispatchUpdate();
    void apiFetch("/api/aca/course-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links }),
    }).catch((err) => console.warn("Failed to persist course links to backend", err));
  }
  return cache;
}

export function refreshCourseImportantLinks(): CourseImportantLink[] {
  if (typeof window !== "undefined") {
    void apiFetch("/api/aca/course-settings", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.links) && data.links.length > 0) {
          cache = data.links;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.links));
          dispatchUpdate();
        }
      })
      .catch(() => {
        cache = loadLocal();
        dispatchUpdate();
      });
  }
  return cache;
}

if (typeof window !== "undefined") {
  cache = loadLocal();
  refreshCourseImportantLinks();
}
