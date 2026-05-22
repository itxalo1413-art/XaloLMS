"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/student/Sidebar";
import { Topbar } from "@/components/student/Topbar";
import { ProfileModal } from "@/components/student/ProfileModal";
import { StudentAuthProvider } from "@/contexts/StudentAuthContext";
import { useStudentProfile } from "@/hooks/useStudentProfile";

function StudentLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { profile, openProfile, profileModalProps } = useStudentProfile();

  const pageTitle =
    pathname === "/"
      ? "Thông tin học viên"
      : pathname === "/skill" || pathname === "/course-info"
        ? "Thông tin khóa học"
        : pathname === "/ho-tro-tu-hoc"
          ? "Hỗ trợ tự học"
          : pathname.startsWith("/tai-lieu-them")
            ? "Kho tài liệu"
            : "Thông tin học viên";

  const mobileItems = [
    { href: "/", label: "Thông tin học viên" },
    { href: "/skill", label: "Thông tin khóa học" },
    { href: "/ho-tro-tu-hoc", label: "Hỗ trợ tự học" },
    { href: "/tai-lieu-them", label: "Kho tài liệu" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen w-full">
        <Sidebar onOpenProfile={openProfile} />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto md:pl-72">
          <Topbar
            title={pageTitle}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenProfile={openProfile}
            profileName={profile.name}
            avatarUrl={profile.avatarUrl}
          />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-[18px] md:px-8">
            {children}
          </main>
        </div>
      </div>
      {menuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/25"
          />
          <aside className="relative h-full w-[84%] max-w-[320px] bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <Link
                href="/"
                aria-label="Về trang chủ"
                onClick={() => setMenuOpen(false)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
              >
                <img
                  src="/Logo_XLE.svg"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-auto shrink-0 object-contain"
                  role="presentation"
                />
                <img
                  src="/XALO.ENGLISH.svg"
                  alt=""
                  className="h-4 w-auto max-w-[min(11rem,100%)] shrink object-contain"
                  role="presentation"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1 text-zinc-500 hover:bg-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              {mobileItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={[
                      "block rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary text-white shadow-soft"
                        : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
      <ProfileModal {...profileModalProps} />
    </div>
  );
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentAuthProvider>
      <StudentLayoutInner>{children}</StudentLayoutInner>
    </StudentAuthProvider>
  );
}
