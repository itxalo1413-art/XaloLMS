"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  type AuthUser,
  cacheAuthUser,
  clearAuthToken,
  fetchMe,
  getAuthBypassUser,
  getAuthToken,
  getCachedAuthUser,
  homePathForRole,
  isAuthDisabled,
  isAuthSessionError,
  syncSessionCookie,
} from "@/lib/auth";

type StudentAuthContextValue = {
  user: AuthUser;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const StudentAuthContext = React.createContext<StudentAuthContextValue | null>(null);

export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [ready, setReady] = React.useState(false);

  const logout = React.useCallback(() => {
    if (isAuthDisabled()) {
      router.replace("/");
      return;
    }
    clearAuthToken();
    router.replace("/login");
  }, [router]);

  const refreshUser = React.useCallback(async () => {
    const me = await fetchMe();
    cacheAuthUser(me);
    setUser(me);
  }, []);

  React.useLayoutEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (isAuthDisabled()) {
        const demo = getAuthBypassUser();
        cacheAuthUser(demo);
        if (!cancelled) {
          setUser(demo);
          setReady(true);
        }
        return;
      }

      if (pathname === "/login") {
        if (!cancelled) setReady(true);
        return;
      }

      const token = getAuthToken();
      const cached = getCachedAuthUser();
      if (!token || !cached) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      syncSessionCookie();
      if (!cancelled) {
        setUser(cached);
        setReady(true);
      }

      try {
        const me = await fetchMe();
        if (cancelled) return;
        cacheAuthUser(me);
        setUser(me);

        const home = homePathForRole(me.role);
        const onStudentPath = !pathname.startsWith("/teacher") && !pathname.startsWith("/aca");
        const onTeacherPath = pathname.startsWith("/teacher");
        const onAcaPath = pathname.startsWith("/aca");

        if (me.role === "HS" && !onStudentPath) {
          router.replace("/");
          return;
        }
        if (me.role === "GV" && !onTeacherPath) {
          router.replace(home);
          return;
        }
        if (me.role === "ACA" && !onAcaPath) {
          router.replace(home);
        }
      } catch (err) {
        if (cancelled) return;
        if (isAuthSessionError(err)) {
          clearAuthToken();
          setUser(null);
          setReady(false);
          router.replace("/login");
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready || !user) {
    return null;
  }

  return (
    <StudentAuthContext.Provider value={{ user, refreshUser, logout }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const ctx = React.useContext(StudentAuthContext);
  if (!ctx) {
    throw new Error("useStudentAuth must be used within StudentAuthProvider");
  }
  return ctx;
}
