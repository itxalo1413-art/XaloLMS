"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthToken, getCachedAuthUser } from "@/lib/auth";
import { syncGraderMeetLinksFromBackend } from "@/lib/graderMeetLinks";
import { syncMockTestTeacherOptions } from "@/lib/mockTestTeacherNames";

interface NavItem {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  match: (p: string) => boolean;
}

const IconCalendar = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconSpeaking = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const IconWriting = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconScores = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconLogout = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconBcb = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    href: "/sale/bcb",
    label: "Bảng Chẩn Bệnh (BCB)",
    desc: "Sale điền L & R — W/S do Grader",
    icon: <IconBcb />,
    match: (p) => (p.startsWith("/sale/bcb") && !p.startsWith("/sale/bcb-entrance")) || p === "/sale",
  },
  {
    href: "/sale/bcb-entrance",
    label: "BCB Entrance",
    desc: "BCB chi tiết theo booking Entrance",
    icon: <IconBcb />,
    match: (p) => p.startsWith("/sale/bcb-entrance"),
  },
  {
    href: "/sale/test-speaking",
    label: "Test Speaking Entrance",
    desc: "Lịch rảnh & xếp ca phỏng vấn 1-1",
    icon: <IconSpeaking />,
    match: (p) => p.startsWith("/sale/test-speaking") || p.startsWith("/sale/lich-ranh"),
  },
  {
    href: "/sale/cham-writing",
    label: "Writing Entrance",
    desc: "Nộp link bài làm — tự phân Grader",
    icon: <IconWriting />,
    match: (p) => p.startsWith("/sale/cham-writing"),
  },
];

function SidebarNav({ user, onLogout }: { user: { name: string; email: string } | null; onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-dvh w-72 p-4 md:block">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-soft border border-zinc-200/80">
        {/* Brand */}
        <div className="flex shrink-0 items-center justify-between px-5 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <img src="/Logo_XLE.svg" alt="Logo XLE" className="h-8 w-auto object-contain" />
            <div>
              <p className="font-extrabold text-sm text-zinc-900 leading-tight">Xa Lộ English</p>
              <span className="inline-flex items-center mt-0.5 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.2 text-[10px] font-black uppercase tracking-wider text-primary">
                SALE / BD
              </span>
            </div>
          </div>
        </div>

        {/* Section title */}
        <div className="px-5 pt-4 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
          Công cụ làm việc SALE
        </div>

        {/* Nav list */}
        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200",
                  active
                    ? "bg-primary text-white shadow-premium"
                    : "text-zinc-600 hover:bg-primary-soft/30 hover:text-zinc-900",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-200",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 text-primary group-hover:bg-primary group-hover:text-white",
                  ].join(" ")}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-xs font-bold leading-tight ${active ? "text-white" : "text-zinc-800"}`}>
                    {item.label}
                  </div>
                  <div className={`truncate text-[10px] leading-tight ${active ? "text-white/80" : "text-zinc-400"}`}>
                    {item.desc}
                  </div>
                </div>
                {active && <div className="ml-1 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer with User info & Logout */}
        <div className="border-t border-zinc-100 p-3 bg-zinc-50/50 space-y-2">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white border border-zinc-200/80 shadow-xs">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-zinc-900 truncate leading-tight">{user.name}</div>
                <div className="text-[10px] text-zinc-400 truncate leading-tight font-mono">{user.email}</div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-zinc-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <IconLogout />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}

export function SaleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<{ name: string; email: string } | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const cached = getCachedAuthUser();
    if (!cached || cached.role !== "SALE") {
      router.replace("/login?error=role");
      return;
    }
    setUser({ name: cached.name, email: cached.email });
  }, [router]);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    void syncGraderMeetLinksFromBackend();
    void syncMockTestTeacherOptions();
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    router.replace("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
        <div className="text-primary text-sm font-semibold animate-pulse">Đang xác thực...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      {/* Desktop Sidebar */}
      <SidebarNav user={user} onLogout={handleLogout} />

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <aside className="relative h-full w-[80%] max-w-[300px] bg-white p-4 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <img src="/Logo_XLE.svg" alt="Logo" className="h-7 w-auto" />
                  <span className="font-extrabold text-sm text-zinc-900">Xalo LMS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
                >
                  ✕
                </button>
              </div>

              <nav className="mt-4 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                        active
                          ? "bg-primary text-white shadow-sm"
                          : "text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl p-3 text-xs font-bold text-rose-600 hover:bg-rose-50 w-full"
            >
              <IconLogout />
              Đăng xuất
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 md:px-8 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700"
              aria-label="Mở menu"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Bộ phận Tư vấn & Tuyển sinh
              </div>
              <div className="text-sm font-black text-zinc-900 leading-none mt-0.5">
                {user.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              ● Online
            </span>
            <div className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
