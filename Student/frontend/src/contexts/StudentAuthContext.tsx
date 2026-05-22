"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  type AuthUser,
  cacheAuthUser,
  clearAuthToken,
  fetchMe,
  getAuthBypassUser,
  getAuthToken,
  getCachedAuthUser,
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

      const token = getAuthToken();
      if (!token) {
        router.replace("/login");
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
        if (me.role !== "HS") {
          clearAuthToken();
          router.replace("/login?error=role");
          return;
        }
      } catch {
        if (!cancelled) {
          clearAuthToken();
          router.replace("/login");
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
