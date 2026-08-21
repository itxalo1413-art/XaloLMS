import type { InstructorPublicProfile } from "@/lib/courseInstructorProfile";
import { canUseAcaApi, getAcaKv, mergeAcaKv } from "@/lib/acaManagementApi";
import { getAuthToken } from "@/lib/auth";

export type InstructorProfileExtra = Omit<
  InstructorPublicProfile,
  "name" | "title" | "email" | "phone"
>;

const KV_NAMESPACE = "instructorProfileExtras";
const STORAGE_KEY = "xalo.instructor.profiles.v1";
export const INSTRUCTOR_PROFILES_UPDATE_EVENT = "xalo-instructor-profiles-updated";

const EMPTY_EXTRA: InstructorProfileExtra = {
  ieltsBand: "",
  specialties: [],
  experience: "",
  certifications: [],
  bio: "",
};

let cache: Record<string, InstructorProfileExtra> = {};
let syncPromise: Promise<void> | null = null;

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INSTRUCTOR_PROFILES_UPDATE_EVENT));
}

function loadLocal(): Record<string, InstructorProfileExtra> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, InstructorProfileExtra>;
  } catch {
    return {};
  }
}

function saveLocal(next: Record<string, InstructorProfileExtra>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function syncInstructorProfilesFromBackend(): Promise<void> {
  if (!canUseAcaApi() || !getAuthToken()) return;
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try {
      const data = await getAcaKv(KV_NAMESPACE);
      if (data && typeof data === "object") {
        cache = { ...cache, ...(data as Record<string, InstructorProfileExtra>) };
        saveLocal(cache);
        dispatchUpdate();
      }
    } catch {
      // ignore
    } finally {
      syncPromise = null;
    }
  })();
  return syncPromise;
}

export function getInstructorProfileExtras(): Record<string, InstructorProfileExtra> {
  if (typeof window !== "undefined" && Object.keys(cache).length === 0) {
    cache = loadLocal();
  }
  return cache;
}

export function getInstructorProfileExtra(name: string): InstructorProfileExtra | undefined {
  const key = name.trim();
  if (!key) return undefined;
  const extras = getInstructorProfileExtras()[key];
  return extras ?? undefined;
}

export function saveInstructorProfileExtra(
  name: string,
  extra: InstructorProfileExtra,
): Record<string, InstructorProfileExtra> {
  const key = name.trim();
  if (!key) return getInstructorProfileExtras();
  cache = { ...getInstructorProfileExtras(), [key]: extra };
  saveLocal(cache);
  dispatchUpdate();

  if (canUseAcaApi() && getAuthToken()) {
    void mergeAcaKv(KV_NAMESPACE, { [key]: extra }).catch((err) =>
      console.warn("Failed to persist instructor profile to backend", err),
    );
  }
  return cache;
}

export function refreshInstructorProfileExtras(): Record<string, InstructorProfileExtra> {
  cache = loadLocal();
  dispatchUpdate();
  void syncInstructorProfilesFromBackend();
  return cache;
}

export function emptyInstructorProfileExtra(): InstructorProfileExtra {
  return { ...EMPTY_EXTRA };
}

if (typeof window !== "undefined") {
  cache = loadLocal();
  void syncInstructorProfilesFromBackend();
}
