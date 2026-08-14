import { apiFetch, getAuthToken, isAuthDisabled } from "@/lib/auth";

export type CoursePhase = { name: string; date: string };

export type CourseMetadata = {
  course: string;
  instructor: string;
  room: string;
  zoomPassword: string;
  schedule: string[];
  phases: CoursePhase[];
  openDate?: string;
  endDate?: string;
};

export const DEFAULT_COURSE_METADATA: CourseMetadata = {
  course: "Offline Momentum",
  instructor: "Nghiêm Doãn Quỳnh Châu",
  room: "Phòng 3.1",
  zoomPassword: "—",
  schedule: [
    "Thứ 3: 19h45 - 21h30",
    "Thứ 5: 19h45 - 21h30",
    "Thứ 7: 19h45 - 21h30",
  ],
  phases: [
    { name: "Chặng 1: Speaking - Reading", date: "09/10/2025" },
    { name: "Chặng 2: Writing - Listening", date: "30/04/2026" },
  ],
};

const STORAGE_KEY = "xalo.course.metadata.v1";
export const COURSE_METADATA_UPDATE_EVENT = "xalo-course-metadata-updated";

let cache: CourseMetadata = { ...DEFAULT_COURSE_METADATA };

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COURSE_METADATA_UPDATE_EVENT));
}

function loadLocal(): CourseMetadata {
  if (typeof window === "undefined") return { ...DEFAULT_COURSE_METADATA };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COURSE_METADATA };
    const data = JSON.parse(raw) as CourseMetadata;
    return {
      ...DEFAULT_COURSE_METADATA,
      ...data,
      schedule: data.schedule?.length ? data.schedule : DEFAULT_COURSE_METADATA.schedule,
      phases: data.phases?.length ? data.phases : DEFAULT_COURSE_METADATA.phases,
    };
  } catch {
    return { ...DEFAULT_COURSE_METADATA };
  }
}

export function getCourseMetadata(): CourseMetadata {
  if (typeof window !== "undefined" && cache === DEFAULT_COURSE_METADATA) {
    cache = loadLocal();
  }
  return cache;
}

export function saveCourseMetadata(next: CourseMetadata): CourseMetadata {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    dispatchUpdate();
    void apiFetch("/api/aca/course-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch((err) => console.warn("Failed to persist course settings to backend", err));
  }
  return next;
}

export async function fetchCourseMetadataFromApi(): Promise<CourseMetadata> {
  const response = await apiFetch("/api/aca/course-settings", { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch class info (${response.status})`);
  }
  return response.json();
}

export function refreshCourseMetadata(): CourseMetadata {
  void fetchCourseMetadataFromApi()
    .then((remote) => {
      if (remote && remote.course) {
        cache = remote;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        }
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
  refreshCourseMetadata();
}
