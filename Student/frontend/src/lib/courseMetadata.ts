import { apiFetch, getAuthToken, getCachedAuthUser, isAuthDisabled } from "@/lib/auth";

export type CoursePhase = { name: string; date: string };

export type CourseMetadata = {
  course: string;
  instructor: string;
  room: string;
  zoomPassword: string;
  zoomLink?: string;
  schedule: string[];
  phases: CoursePhase[];
  openDate?: string;
  endDate?: string;
  links?: CourseImportantLinkLike[];
  classId?: string;
  mode?: "" | "group" | "one-to-one";
  oneToOne?: {
    id: string;
    className: string;
    teacher: string;
    schedule: string;
    zoomLink: string;
    successorLink: string;
    materials: string;
    status: string;
    startDate: string;
    endDate: string;
    progress: string;
  } | null;
};

type CourseImportantLinkLike = {
  id: string;
  label: string;
  value: string;
  url: string;
};

/** Template ACA / offline — không dùng làm dữ liệu học viên khi đã login. */
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

export const EMPTY_COURSE_METADATA: CourseMetadata = {
  course: "",
  instructor: "",
  room: "",
  zoomPassword: "—",
  zoomLink: "",
  schedule: [],
  phases: [],
  openDate: "",
  endDate: "",
  links: [],
  classId: "",
  mode: "",
  oneToOne: null,
};

const STORAGE_KEY = "xalo.course.metadata.v1";
export const COURSE_METADATA_UPDATE_EVENT = "xalo-course-metadata-updated";

let cache: CourseMetadata = { ...EMPTY_COURSE_METADATA };

function canUseLiveCourseApi(): boolean {
  return Boolean(getAuthToken()) || isAuthDisabled();
}

function isStudentPortalUser(): boolean {
  const role = getCachedAuthUser()?.role;
  return role === "HS" || (!role && Boolean(getAuthToken()));
}

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COURSE_METADATA_UPDATE_EVENT));
}

function loadLocal(): CourseMetadata {
  if (typeof window === "undefined") {
    return canUseLiveCourseApi() && isStudentPortalUser()
      ? { ...EMPTY_COURSE_METADATA }
      : { ...DEFAULT_COURSE_METADATA };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return canUseLiveCourseApi() && isStudentPortalUser()
        ? { ...EMPTY_COURSE_METADATA }
        : { ...DEFAULT_COURSE_METADATA };
    }
    const data = JSON.parse(raw) as CourseMetadata;
    const zoomPassword =
      data.zoomPassword === "db_pass_2026_secured" ? "—" : (data.zoomPassword || "—");
    // Học viên đã login: không merge seed DEFAULT (tránh hiện lớp Momentum giả).
    if (canUseLiveCourseApi() && isStudentPortalUser()) {
      return {
        ...EMPTY_COURSE_METADATA,
        ...data,
        zoomPassword,
        schedule: Array.isArray(data.schedule) ? data.schedule : [],
        phases: Array.isArray(data.phases) ? data.phases : [],
      };
    }
    return {
      ...DEFAULT_COURSE_METADATA,
      ...data,
      zoomPassword,
      schedule: data.schedule?.length ? data.schedule : DEFAULT_COURSE_METADATA.schedule,
      phases: data.phases?.length ? data.phases : DEFAULT_COURSE_METADATA.phases,
    };
  } catch {
    return canUseLiveCourseApi() && isStudentPortalUser()
      ? { ...EMPTY_COURSE_METADATA }
      : { ...DEFAULT_COURSE_METADATA };
  }
}

export function getCourseMetadata(): CourseMetadata {
  return cache;
}

export function saveCourseMetadata(next: CourseMetadata): CourseMetadata {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    dispatchUpdate();
    const body: Record<string, unknown> = { ...next };
    if (next.classId) body.classId = next.classId;
    void apiFetch("/api/aca/course-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

export async function fetchStudentClassInfoFromApi(): Promise<CourseMetadata> {
  const response = await apiFetch("/api/student/profile/class-info", { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch student class info (${response.status})`);
  }
  return response.json();
}

export function refreshCourseMetadata(): CourseMetadata {
  const useStudentEndpoint = Boolean(getAuthToken()) && isStudentPortalUser();
  void (useStudentEndpoint ? fetchStudentClassInfoFromApi() : fetchCourseMetadataFromApi())
    .then((remote) => {
      if (!remote) return;
      cache = {
        ...EMPTY_COURSE_METADATA,
        ...remote,
        schedule: Array.isArray(remote.schedule) ? remote.schedule : [],
        phases: Array.isArray(remote.phases) ? remote.phases : [],
        links: Array.isArray(remote.links) ? remote.links : [],
        oneToOne: remote.oneToOne ?? null,
        mode: remote.mode || "",
        classId: remote.classId || "",
        zoomLink: remote.zoomLink || "",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        // Học viên: đồng bộ important links từ class-info (theo lớp), không lấy global
        if (useStudentEndpoint && Array.isArray(remote.links)) {
          window.dispatchEvent(
            new CustomEvent("xalo-student-class-links", { detail: remote.links }),
          );
        }
      }
      dispatchUpdate();
    })
    .catch(() => {
      if (useStudentEndpoint) {
        cache = { ...EMPTY_COURSE_METADATA };
      } else {
        cache = loadLocal();
      }
      dispatchUpdate();
    });
  return cache;
}

if (typeof window !== "undefined") {
  cache = loadLocal();
  refreshCourseMetadata();
}
