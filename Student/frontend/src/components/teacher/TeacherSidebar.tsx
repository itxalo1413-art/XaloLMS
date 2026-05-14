"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/teacher", label: "Danh sách học sinh" },
  { href: "/teacher/mock-test", label: "Lịch Mock Test" },
];

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 p-4 transition-all duration-300 md:block">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="flex items-center gap-3 px-6 py-6">
          <img
            src="/Logo_XLE.svg"
            alt="Logo XLE"
            className="h-8 w-auto object-contain"
          />
          <img
            src="/XALO.ENGLISH.svg"
            alt="Logo phụ âm bản"
            className="h-4 w-auto object-contain"
          />
        </div>

        <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-background to-transparent"></div>

        <nav className="flex min-h-0 flex-1 flex-col px-3 pb-4">
          <div className="min-h-0 flex-1 space-y-1">
            <div className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
              Giáo viên
            </div>
            {items.map(({ href, label }) => {
              const active =
                href === "/teacher"
                  ? pathname === "/teacher" || pathname.startsWith("/teacher/hoc-sinh")
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300",
                    active
                      ? "bg-primary text-white shadow-premium"
                      : "text-muted hover:bg-primary-soft/70 hover:text-foreground",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition-all duration-300",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-white text-primary group-hover:bg-primary-soft group-hover:text-primary",
                    ].join(" ")}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
                      <path d="M5 6h14M5 12h14M5 18h14" />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold transition-colors ${active ? "text-white" : "text-muted"}`}>
                    {label}
                  </span>
                  {active ? <div className="ml-auto h-1 w-1 animate-pulse rounded-full bg-white" /> : null}
                </Link>
              );
            })}
          </div>

          <div className="shrink-0 space-y-1 border-t border-zinc-100 pt-4">
            <div className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
              Tài khoản
            </div>
            <button
              type="button"
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-muted transition-all duration-200 hover:bg-background hover:text-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-muted transition-all group-hover:text-foreground">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-xs font-bold">Đăng xuất</span>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
