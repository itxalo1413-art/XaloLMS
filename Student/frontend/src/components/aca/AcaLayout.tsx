"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AcaSidebar } from "./AcaSidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  cacheAuthUser,
  clearAuthToken,
  fetchMe,
  getCachedAuthUser,
  getAuthToken,
  homePathForRole,
  isAuthDisabled,
  isAuthSessionError,
} from "@/lib/auth";

const RESTRICTED_PATHS = [
  "/aca/quan-ly/lop-theo-thang",
  "/aca/quan-ly/hoc-vien-lop",
  "/aca/quan-ly/diem-dau-vao-cuoi-khoa",
  "/aca/quan-ly/bcb",
  "/aca/quan-ly/phan-tich-final-test",
  "/aca/quan-ly/lop-1-1",
  "/aca/quan-ly/lop-luyen-de-tuan",
  "/aca/quan-ly/giao-vien",
  "/aca/quan-ly/khoa-hoc",
  "/aca/quan-ly/noi-dung",
  "/aca/quan-ly/note",
  "/aca/quan-ly/lop-luyen-de",
  "/aca/quan-ly/chan-doan-khach",
  "/aca/he-thong",
  "/aca/phan-tich",
];

export function AcaLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [isKhanhThi, setIsKhanhThi] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Auth guard: only ACA role allowed
  useEffect(() => {
    if (isAuthDisabled()) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;

    async function verifyAcaSession() {
      const token = getAuthToken();
      const cached = getCachedAuthUser();
      if (!token || !cached) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      if (cached.role !== "ACA") {
        clearAuthToken();
        router.replace("/login?error=role");
        return;
      }

      try {
        const me = await fetchMe();
        if (cancelled) return;
        if (me.role !== "ACA") {
          clearAuthToken();
          router.replace(`/login?error=role`);
          return;
        }
        cacheAuthUser(me);
        setAuthReady(true);
      } catch (err) {
        if (cancelled) return;
        if (isAuthSessionError(err)) {
          clearAuthToken();
          router.replace("/login");
          return;
        }
        setAuthReady(true);
      }
    }

    void verifyAcaSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const user = getCachedAuthUser();
    const name = (user?.name || "").trim().toLowerCase();
    const email = (user?.email || "").trim().toLowerCase();
    
    setIsKhanhThi(
      name === "lê nguyễn khánh thi" ||
        name.includes("khánh thi") ||
        email === "aca@xaloenglish.vn",
    );
    setReady(true);
  }, []);

  const handleLogout = () => {
    if (isAuthDisabled()) {
      router.replace("/");
      return;
    }
    clearAuthToken();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <AcaSidebar />

      {/* Mobile Topbar */}
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
          <span className="text-xs font-black text-foreground tracking-tight">Portal ACA</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-muted hover:text-foreground"
          title="Đăng xuất"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
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

              <div className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60 px-2">
                Hỗ trợ W-S
              </div>

              <nav className="space-y-1.5">
                {[
                  { href: "/aca/quan-ly/cham-writing", label: "Chấm Writing" },
                  { href: "/aca/profile", label: "Hồ sơ ACA" },
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
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="md:pl-72">
        <div className="min-h-screen">
          {!authReady ? (
            <div className="flex min-h-screen items-center justify-center text-sm font-medium text-zinc-400">
              Đang xác thực...
            </div>
          ) : ready && !isKhanhThi && RESTRICTED_PATHS.some(path => pathname.startsWith(path)) ? (
            <div className="min-h-screen flex flex-col bg-white">
              <header className="sticky top-0 z-30 hidden h-[73px] w-full items-center justify-between border-b border-zinc-100 bg-white/80 px-8 backdrop-blur-md md:flex">
                <div>
                  <h1 className="text-sm font-black text-foreground uppercase tracking-wider">Không có quyền truy cập</h1>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Trang web giới hạn quyền hạn truy cập của nhân viên.</p>
                </div>
              </header>
              <main className="mx-auto max-w-7xl px-6 py-24 md:px-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-zinc-900">Quyền truy cập bị từ chối</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Chỉ tài khoản của **Lê Nguyễn Khánh Thi** mới được quyền xem và thực hiện thao tác trên trang này.
                </p>
              </main>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
