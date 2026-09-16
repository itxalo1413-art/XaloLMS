"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  cacheAuthUser,
  clearAuthToken,
  fetchMe,
  getCachedAuthUser,
  getAuthToken,
  isAuthDisabled,
  isAuthSessionError,
  syncSessionCookie,
} from "@/lib/auth";
import { GRADER_PATHS, isAcaAcademicHead, isGraderUser } from "@/lib/acaIdentity";
import { GraderSidebar } from "./GraderSidebar";
import { GraderMobileNav } from "./GraderMobileNav";

export function GraderLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

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
    if (cached.role !== "ACA" && cached.role !== "GRADER") {
      clearAuthToken();
      router.replace("/login?error=role");
      return;
    }

    // Học vụ trưởng dùng portal ACA
    if (isAcaAcademicHead(cached)) {
      router.replace("/aca/quan-ly/lop-theo-thang");
      return;
    }

    if (!isGraderUser(cached)) {
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
        if (me.role !== "ACA" && me.role !== "GRADER") {
          clearAuthToken();
          router.replace("/login?error=role");
          return;
        }
        if (isAcaAcademicHead(me)) {
          router.replace("/aca/quan-ly/lop-theo-thang");
          return;
        }
        if (!isGraderUser(me)) {
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
      <GraderSidebar />
      <GraderMobileNav />

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative h-full w-[80%] max-w-[280px] bg-white p-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <img src="/Logo_XLE.svg" alt="Logo XLE" className="h-7 w-auto object-contain" />
                  <span className="font-bold text-sm">Portal Grader</span>
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
                {[
                  { href: GRADER_PATHS.writing, label: "Chấm Writing" },
                  { href: GRADER_PATHS.speaking, label: "Test Speaking" },
                  { href: GRADER_PATHS.freeSlots, label: "Lịch rảnh" },
                  { href: GRADER_PATHS.profile, label: "Hồ sơ Grader" },
                ].map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                        active
                          ? "bg-primary text-white shadow-soft"
                          : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
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

      <div className="md:pl-72 pt-14 md:pt-0">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}

/** Alias topbar — dùng chung style ACA. */
export { AcaTopbar as GraderTopbar } from "@/components/aca/AcaTopbar";
