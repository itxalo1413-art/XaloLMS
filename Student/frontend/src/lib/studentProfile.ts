import { normalizeFocusSkills, type FocusSkill } from "@/lib/focusSkills";
import {
  STUDY_CLASS_ENVIRONMENT_OPTIONS,
  STUDY_IELTS_MEANING_OPTIONS,
  STUDY_METHOD_OPTIONS,
  STUDY_PREVIOUS_BAND_OPTIONS,
  STUDY_WEEKLY_HOURS_OPTIONS,
} from "@/lib/studentProfileStudyOptions";
import { DEFAULT_STUDENT_ID } from "@/lib/studentIds";
import { getRosterStudent, resolveActiveStudentId } from "@/lib/studentRoster";

export type StudentProfile = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  zodiac: string;
  avatarUrl: string;
  method: (typeof STUDY_METHOD_OPTIONS)[number];
  weeklyHours: (typeof STUDY_WEEKLY_HOURS_OPTIONS)[number];
  classEnvironment: (typeof STUDY_CLASS_ENVIRONMENT_OPTIONS)[number];
  ieltsMeaning: (typeof STUDY_IELTS_MEANING_OPTIONS)[number];
  previousBand: (typeof STUDY_PREVIOUS_BAND_OPTIONS)[number];
  focusSkills: FocusSkill[];
};

export const STUDENT_PROFILE_STORAGE_KEY = "xalo.student.profile.v1";
export const STUDENT_PROFILES_STORAGE_KEY = "xalo.student.profiles.v2";
export const STUDENT_PROFILE_UPDATE_EVENT = "xalo-student-profile-updated";

export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  name: "Dương Ngọc Khôi Nguyên",
  email: "nguyenduong939705@gmail.com",
  phone: "0947 188 794",
  dob: "20/08/2006",
  zodiac: "Sư Tử",
  avatarUrl: "",
  method: STUDY_METHOD_OPTIONS[0],
  weeklyHours: STUDY_WEEKLY_HOURS_OPTIONS[2],
  classEnvironment: STUDY_CLASS_ENVIRONMENT_OPTIONS[0],
  ieltsMeaning: STUDY_IELTS_MEANING_OPTIONS[0],
  previousBand: STUDY_PREVIOUS_BAND_OPTIONS[0],
  focusSkills: ["Listening"],
};

type ProfilesMap = Record<string, StudentProfile>;

function dispatchProfileUpdate(studentId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(STUDENT_PROFILE_UPDATE_EVENT, { detail: { studentId } }),
  );
}

function buildDefaultProfile(studentId: string): StudentProfile {
  const roster = getRosterStudent(studentId);
  return {
    ...DEFAULT_STUDENT_PROFILE,
    name: roster?.name ?? DEFAULT_STUDENT_PROFILE.name,
    email: roster?.email ?? DEFAULT_STUDENT_PROFILE.email,
    phone: roster?.phone ?? DEFAULT_STUDENT_PROFILE.phone,
  };
}

function mergeProfile(parsed: Partial<StudentProfile>, studentId: string): StudentProfile {
  const base = buildDefaultProfile(studentId);
  const merged = { ...base, ...parsed };
  // Normalize old demo seed to the full roster name.
  if (merged.name.trim() === "Dương Nguyên") {
    merged.name = base.name;
  }
  merged.focusSkills = normalizeFocusSkills(parsed.focusSkills ?? merged.focusSkills);
  return merged;
}

function migrateLegacyProfile(): ProfilesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<StudentProfile>;
    const migrated = {
      [DEFAULT_STUDENT_ID]: mergeProfile(parsed, DEFAULT_STUDENT_ID),
    };
    localStorage.setItem(STUDENT_PROFILES_STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return {};
  }
}

function loadAllProfiles(): ProfilesMap {
  if (typeof window === "undefined") return {};
  let map: ProfilesMap = {};
  try {
    const raw = localStorage.getItem(STUDENT_PROFILES_STORAGE_KEY);
    if (raw) {
      map = JSON.parse(raw) as ProfilesMap;
    } else {
      map = migrateLegacyProfile();
    }
  } catch {
    map = migrateLegacyProfile();
  }
  return map;
}

export function getStudentProfile(studentId?: string): StudentProfile {
  const id = studentId ?? resolveActiveStudentId();
  if (typeof window === "undefined") return buildDefaultProfile(id);
  const stored = loadAllProfiles()[id];
  return stored ?? buildDefaultProfile(id);
}

/** @deprecated Use getStudentProfile */
export function loadStudentProfileFromStorage(studentId?: string): StudentProfile {
  return getStudentProfile(studentId);
}

export function saveStudentProfile(profile: StudentProfile, studentId?: string): void {
  if (typeof window === "undefined") return;
  const id = studentId ?? resolveActiveStudentId();
  const all = loadAllProfiles();
  all[id] = mergeProfile(profile, id);
  localStorage.setItem(STUDENT_PROFILES_STORAGE_KEY, JSON.stringify(all));
  dispatchProfileUpdate(id);
}

/** @deprecated Use saveStudentProfile */
export function saveStudentProfileToStorage(profile: StudentProfile, studentId?: string): void {
  saveStudentProfile(profile, studentId);
}
