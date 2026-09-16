"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { TeacherSidebar } from "./TeacherSidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  cacheAuthUser,
  clearAuthToken,
  fetchMe,
  getAuthToken,
  getCachedAuthUser,
  isAuthDisabled,
  isAuthSessionError,
  syncSessionCookie,
} from "@/lib/auth";
import { syncGraderMeetLinksFromBackend } from "@/lib/graderMeetLinks";
import { syncInstructorProfilesFromBackend } from "@/lib/instructorProfileStore";

export function TeacherLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useLayoutEffect(() => {
    if (isAuthDisabled()) {
      setAuthReady(true);
      return;
    }

    const token = getAuthToken();
    const cached = getCachedAuthUser();
    if (!token || !cached) {
      clearAuthToken();
      router.replace("/login");
      return;
    }
    if (cached.role !== "GV") {
      clearAuthToken();
      router.replace("/login?error=role");
      return;
    }

    syncSessionCookie();
    setAuthReady(true);

    let cancelled = false;
    void fetchMe()
      .then((me) => {
        if (cancelled) return;
        if (me.role !== "GV") {
          clearAuthToken();
          router.replace("/login?error=role");
          return;
        }
        cacheAuthUser(me);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAuthSessionError(err)) {
          clearAuthToken();
          router.replace("/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  useEffect(() => {
    void syncGraderMeetLinksFromBackend();
    void syncInstructorProfilesFromBackend();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (isAuthDisabled()) {
      router.replace("/");
      return;
    }
    clearAuthToken();
    router.replace("/login");
  };

  if (!authReady && !isAuthDisabled()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-zinc-500 font-semibold">
        Đang xác thực…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />

      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-zinc-100 bg-white/80 px-5 py-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600"
            aria-label="Mở menu"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="text-xs font-black text-foreground tracking-tight">Portal Giáo viên</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-muted hover:text-foreground"
          title="Đăng xuất"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            aria-label="Đóng menu"
          />
          <aside className="relative h-full w-[80%] max-w-[280px] bg-white p-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <img src="/Logo_XLE.svg" alt="Logo XLE" className="h-7 w-auto object-contain" />
                  <span className="font-bold text-sm">Xa Lộ English</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-1.5">
                <Link
                  href="/teacher"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Trang chủ GV
                </Link>
                <Link
                  href="/teacher/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Hồ sơ
                </Link>
              </nav>
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
            >
              Đăng xuất
            </button>
          </aside>
        </div>
      ) : null}

      <div className="md:pl-72 pt-0">{children}</div>
    </div>
  );
}
