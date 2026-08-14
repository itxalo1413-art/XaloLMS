import { apiFetch, getAuthToken, getCachedAuthUser, isAuthDisabled } from "@/lib/auth";

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

let profileCache: Record<PortalRole, PortalProfile> = { ...DEFAULTS };

export function getPortalProfile(role: PortalRole): PortalProfile {
  if (typeof window === "undefined") return { ...DEFAULTS[role] };
  const user = getCachedAuthUser();
  if (user) {
    profileCache[role] = {
      name: user.name || profileCache[role].name,
      email: user.email || profileCache[role].email,
      phone: (user as any).phone || profileCache[role].phone,
      title: (user as any).title || profileCache[role].title || (role === "gv" ? "Giáo viên IELTS" : "Điều phối học thuật"),
    };
  }
  if (!isAuthDisabled() && Boolean(getAuthToken())) {
    void apiFetch("/api/user/profile", { method: "GET" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          if (u) {
            profileCache[role] = {
              name: u.name || profileCache[role].name,
              email: u.email || profileCache[role].email,
              phone: u.phone || profileCache[role].phone,
              title: u.title || profileCache[role].title || (role === "gv" ? "Giáo viên IELTS" : "Điều phối học thuật"),
            };
            localStorage.setItem(keys[role], JSON.stringify(profileCache[role]));
            dispatchUpdate();
          }
        }
      })
      .catch(() => {});
  } else {
    try {
      const raw = localStorage.getItem(keys[role]);
      if (raw) {
        profileCache[role] = { ...DEFAULTS[role], ...(JSON.parse(raw) as PortalProfile) };
      }
    } catch {}
  }
  return profileCache[role];
}

export async function savePortalProfile(
  role: PortalRole,
  profile: PortalProfile,
): Promise<PortalProfile> {
  profileCache[role] = profile;
  if (typeof window !== "undefined") {
    localStorage.setItem(keys[role], JSON.stringify(profile));
    dispatchUpdate();
  }
  if (!isAuthDisabled() && Boolean(getAuthToken())) {
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          title: profile.title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        profileCache[role] = {
          name: u.name || profile.name,
          email: u.email || profile.email,
          phone: u.phone || profile.phone,
          title: u.title || profile.title,
        };
        localStorage.setItem(keys[role], JSON.stringify(profileCache[role]));
        dispatchUpdate();
      }
    } catch (err) {
      console.warn("Failed to sync profile update to API:", err);
    }
  }
  return profileCache[role];
}
