export type CoursePhase = { name: string; date: string };

export type CourseMetadata = {
  course: string;
  instructor: string;
  room: string;
  zoomPassword: string;
  schedule: string[];
  phases: CoursePhase[];
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
    { name: "Chặng 1", date: "21/04/2026" },
    { name: "Chặng 2", date: "11/06/2026 (dự kiến)" },
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
  }
  return next;
}

export function refreshCourseMetadata(): CourseMetadata {
  cache = loadLocal();
  dispatchUpdate();
  return cache;
}

if (typeof window !== "undefined") {
  cache = loadLocal();
}
