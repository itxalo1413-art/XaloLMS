export type PortalRole = "gv" | "aca";

export type PortalProfile = {
  name: string;
  email: string;
  phone: string;
  title: string;
};

const DEFAULTS: Record<PortalRole, PortalProfile> = {
  gv: {
    name: "Nghiêm Doãn Quỳnh Châu",
    email: "chau.teacher@xaloenglish.vn",
    phone: "0900 000 001",
    title: "Giáo viên IELTS",
  },
  aca: {
    name: "Academic Coordinator",
    email: "aca@xaloenglish.vn",
    phone: "0900 000 002",
    title: "Điều phối học thuật",
  },
};

const keys: Record<PortalRole, string> = {
  gv: "xalo.portal.profile.gv.v1",
  aca: "xalo.portal.profile.aca.v1",
};

export const PORTAL_PROFILE_UPDATE_EVENT = "xalo-portal-profile-updated";

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PORTAL_PROFILE_UPDATE_EVENT));
}

export function getPortalProfile(role: PortalRole): PortalProfile {
  if (typeof window === "undefined") return { ...DEFAULTS[role] };
  try {
    const raw = localStorage.getItem(keys[role]);
    if (!raw) return { ...DEFAULTS[role] };
    return { ...DEFAULTS[role], ...(JSON.parse(raw) as PortalProfile) };
  } catch {
    return { ...DEFAULTS[role] };
  }
}

export function savePortalProfile(role: PortalRole, profile: PortalProfile): PortalProfile {
  if (typeof window !== "undefined") {
    localStorage.setItem(keys[role], JSON.stringify(profile));
    dispatchUpdate();
  }
  return profile;
}
