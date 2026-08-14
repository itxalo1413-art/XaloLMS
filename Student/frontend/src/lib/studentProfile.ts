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
  name: "",
  email: "",
  phone: "",
  dob: "",
  zodiac: "",
  avatarUrl: "",
  method: STUDY_METHOD_OPTIONS[0],
  weeklyHours: STUDY_WEEKLY_HOURS_OPTIONS[2],
  classEnvironment: STUDY_CLASS_ENVIRONMENT_OPTIONS[0],
  ieltsMeaning: STUDY_IELTS_MEANING_OPTIONS[0],
  previousBand: STUDY_PREVIOUS_BAND_OPTIONS[0],
  focusSkills: ["Listening"],
};

type ProfilesMap = Record<string, StudentProfile>;

const dynamicStudentCache = new Map<string, { name?: string; email?: string; phone?: string }>();

export function registerStudentInfoCache(
  studentId: string,
  info: { name?: string; email?: string; phone?: string },
) {
  if (!studentId) return;
  const current = dynamicStudentCache.get(studentId) || {};
  dynamicStudentCache.set(studentId, { ...current, ...info });
}

function dispatchProfileUpdate(studentId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(STUDENT_PROFILE_UPDATE_EVENT, { detail: { studentId } }),
  );
}

function buildDefaultProfile(studentId: string): StudentProfile {
  const roster = getRosterStudent(studentId);
  const cached = dynamicStudentCache.get(studentId);

  const isDemoDefault = studentId === DEFAULT_STUDENT_ID || studentId === "student_1";

  const name =
    cached?.name ||
    roster?.name ||
    (isDemoDefault ? "Dương Ngọc Khôi Nguyên" : "Học viên mới");
  const email =
    cached?.email ||
    roster?.email ||
    (isDemoDefault ? "nguyenduong939705@gmail.com" : "");
  const phone =
    cached?.phone ||
    roster?.phone ||
    (isDemoDefault ? "0947 188 794" : "");

  return {
    ...DEFAULT_STUDENT_PROFILE,
    name,
    email,
    phone,
    dob: isDemoDefault ? "20/08/2006" : "",
    zodiac: isDemoDefault ? "Sư Tử" : "",
  };
}

function mergeProfile(parsed: Partial<StudentProfile>, studentId: string): StudentProfile {
  const base = buildDefaultProfile(studentId);
  const merged = { ...base, ...parsed };

  // Ensure name, email, phone do not fall back to old defaults if provided in base
  if (!merged.name) merged.name = base.name;
  if (!merged.email) merged.email = base.email;
  if (!merged.phone) merged.phone = base.phone;

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

import { updateAcaStudent, fetchAcaStudents } from "@/lib/acaManagementApi";

export async function syncStudentProfileFromBackend(studentId?: string): Promise<StudentProfile> {
  const id = studentId ?? resolveActiveStudentId();
  if (typeof window === "undefined") return buildDefaultProfile(id);
  try {
    const students = await fetchAcaStudents();
    const found = students.find((s) => s.id === id || s.email === id);
    if (found) {
      const all = loadAllProfiles();
      const merged = mergeProfile({
        name: found.name,
        email: found.email,
        phone: found.phone,
        dob: (found as any).dob,
        zodiac: (found as any).zodiac,
        avatarUrl: (found as any).avatarUrl,
        method: (found as any).method,
        weeklyHours: (found as any).weeklyHours,
        classEnvironment: (found as any).classEnvironment,
        ieltsMeaning: (found as any).ieltsMeaning,
        previousBand: (found as any).previousBand,
        focusSkills: (found as any).focusSkills,
      }, id);
      all[id] = merged;
      localStorage.setItem(STUDENT_PROFILES_STORAGE_KEY, JSON.stringify(all));
      dispatchProfileUpdate(id);
      return merged;
    }
  } catch (err) {
    console.warn("Could not sync student profile from backend", err);
  }
  return getStudentProfile(id);
}

export function saveStudentProfile(profile: StudentProfile, studentId?: string): void {
  if (typeof window === "undefined") return;
  const id = studentId ?? resolveActiveStudentId();
  const all = loadAllProfiles();
  const merged = mergeProfile(profile, id);
  all[id] = merged;
  localStorage.setItem(STUDENT_PROFILES_STORAGE_KEY, JSON.stringify(all));
  dispatchProfileUpdate(id);

  // Sync to backend DB
  void updateAcaStudent(id, {
    dob: merged.dob,
    zodiac: merged.zodiac,
    avatarUrl: merged.avatarUrl,
    method: merged.method,
    weeklyHours: merged.weeklyHours,
    classEnvironment: merged.classEnvironment,
    ieltsMeaning: merged.ieltsMeaning,
    previousBand: merged.previousBand,
    focusSkills: merged.focusSkills as any,
  }).catch((err) => console.warn("Failed to persist student profile to backend DB", err));
}

/** @deprecated Use saveStudentProfile */
export function saveStudentProfileToStorage(profile: StudentProfile, studentId?: string): void {
  saveStudentProfile(profile, studentId);
}
