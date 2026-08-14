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

  React.useEffect(() => {
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
      if (!token) {
        const demo = getAuthBypassUser();
        cacheAuthUser(demo);
        if (!cancelled) {
          setUser(demo);
          setReady(true);
        }
        return;
      }

      const cached = getCachedAuthUser();
      if (cached && !cancelled) {
        setUser(cached);
        setReady(true);
      }

      try {
        const me = await fetchMe();
        if (cancelled) return;
        cacheAuthUser(me);
        setUser(me);

        // Role-based path guard: redirect to the correct home if on the wrong portal
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
          return;
        }
      } catch {
        if (!cancelled) {
          const fallback = getCachedAuthUser() || getAuthBypassUser();
          setUser(fallback);
          setReady(true);
        }
        return;
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-muted">
        Đang tải phiên đăng nhập...
      </div>
    );
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
