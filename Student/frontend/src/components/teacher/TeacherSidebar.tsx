"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/teacher", label: "Danh sách lớp" },
  { href: "/teacher/lich", label: "Lịch" },
  { href: "/teacher/teaching-materials", label: "Teaching Materials" },
  { href: "/teacher/performance", label: "Performance" },
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
            <Link
              href="/teacher/profile"
              className={[
                "group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                pathname.startsWith("/teacher/profile")
                  ? "bg-primary text-white shadow-premium"
                  : "text-muted hover:bg-background hover:text-foreground",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                  pathname.startsWith("/teacher/profile")
                    ? "bg-white/15 text-white"
                    : "bg-white text-muted group-hover:text-foreground",
                ].join(" ")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </div>
              <span className="text-xs font-bold">Hồ sơ GV</span>
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
