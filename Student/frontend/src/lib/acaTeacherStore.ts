"use client";

import {
  fetchAcaTeacherProfiles,
  createAcaTeacherProfileApi,
  updateAcaTeacherProfileApi,
  deleteAcaTeacherProfileApi,
} from "./acaManagementApi";
import { XALO_GV_ROSTER } from "./xaloTeacherRoster";

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  status: "active" | "inactive";
  joinDate: string;
  notes?: string;
  materialsDriveUrl?: string;
}

export const DEFAULT_TEACHERS: TeacherProfile[] = XALO_GV_ROSTER.map((t) => ({
  id: t.id,
  name: t.name,
  email: t.email,
  phone: "",
  skills: ["Writing", "Speaking", "Reading", "Listening"],
  status: "active" as const,
  joinDate: "",
  notes: "",
  materialsDriveUrl: t.materialsDriveUrl,
}));

const LOCAL_STORAGE_KEY = "xalo_aca_teacher_profiles_v3";

export async function fetchTeacherProfilesAsync(): Promise<TeacherProfile[]> {
  try {
    const fromDb = await fetchAcaTeacherProfiles();
    if (Array.isArray(fromDb) && fromDb.length > 0) {
      saveLocalTeacherProfiles(fromDb);
      return fromDb;
    }
  } catch (err) {
    console.warn("Backend API fetch for teacher profiles failed, using local storage fallback:", err);
  }
  return getLocalTeacherProfiles();
}

export function getLocalTeacherProfiles(): TeacherProfile[] {
  if (typeof window === "undefined") return DEFAULT_TEACHERS;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_TEACHERS));
      return DEFAULT_TEACHERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Error reading teacher profiles from localStorage:", err);
  }
  return DEFAULT_TEACHERS;
}

export function saveLocalTeacherProfiles(profiles: TeacherProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error("Error saving teacher profiles locally:", err);
  }
}

export async function addTeacherProfileAsync(data: Omit<TeacherProfile, "id">): Promise<TeacherProfile> {
  const newId = `tch-${Date.now()}`;
  const payload = { ...data, id: newId };

  try {
    const res = await createAcaTeacherProfileApi(payload);
    const current = getLocalTeacherProfiles();
    const updated = [res, ...current.filter((t) => t.id !== res.id)];
    saveLocalTeacherProfiles(updated);
    return res;
  } catch (err) {
    console.warn("Failed to create teacher profile on backend DB, saving locally:", err);
    const current = getLocalTeacherProfiles();
    const updated = [payload, ...current];
    saveLocalTeacherProfiles(updated);
    return payload;
  }
}

export async function updateTeacherProfileAsync(id: string, data: Partial<TeacherProfile>): Promise<TeacherProfile | null> {
  try {
    const res = await updateAcaTeacherProfileApi(id, data);
    const current = getLocalTeacherProfiles();
    const index = current.findIndex((t) => t.id === id);
    if (index >= 0) {
      current[index] = { ...current[index], ...res };
    } else {
      current.unshift(res);
    }
    saveLocalTeacherProfiles(current);
    return res;
  } catch (err) {
    console.warn("Failed to update teacher profile on backend DB, updating locally:", err);
    const current = getLocalTeacherProfiles();
    const index = current.findIndex((t) => t.id === id);
    if (index < 0) return null;
    const updatedProfile = { ...current[index], ...data };
    current[index] = updatedProfile;
    saveLocalTeacherProfiles(current);
    return updatedProfile;
  }
}

export async function deleteTeacherProfileAsync(id: string): Promise<boolean> {
  try {
    await deleteAcaTeacherProfileApi(id);
    const current = getLocalTeacherProfiles();
    const filtered = current.filter((t) => t.id !== id);
    saveLocalTeacherProfiles(filtered);
    return true;
  } catch (err) {
    console.warn("Failed to delete teacher profile on backend DB, deleting locally:", err);
    const current = getLocalTeacherProfiles();
    const filtered = current.filter((t) => t.id !== id);
    saveLocalTeacherProfiles(filtered);
    return true;
  }
}
