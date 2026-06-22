"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DailyNoteDisplay } from "@/components/student/DailyNoteDisplay";
import { Sidebar } from "@/components/student/Sidebar";
import {
  getStudentDailyNote,
  STUDENT_DAILY_NOTE_UPDATE_EVENT,
} from "@/lib/studentDailyNote";
import { ProfileModal } from "@/components/student/ProfileModal";
import { StudentAuthProvider } from "@/contexts/StudentAuthContext";
import { useStudentProfile } from "@/hooks/useStudentProfile";

const LOGIN_QUOTE_POPUP_KEY = "xalo.showLoginQuotePopup";
const ALWAYS_SHOW_LOGIN_QUOTE = false;

function FolderTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative -mr-3 h-10 flex items-center justify-center transition-all duration-300 select-none shrink-0 w-max px-6 md:px-8",
        active ? "z-20 scale-100" : "z-10 opacity-75 hover:opacity-100 hover:scale-[1.02]",
      ].join(" ")}
    >
      {/* SVG Shape */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        {/* Fill Path */}
        <path
          d="M 0 40 C 10 40 8 0 20 0 L 80 0 C 92 0 90 40 100 40 L 100 41 L 0 41 Z"
          fill="currentColor"
          className={active ? "text-white" : "text-zinc-100/80 hover:text-zinc-100"}
        />
        {/* Stroke Path (open bottom) */}
        <path
          d="M 0 40 C 10 40 8 0 20 0 L 80 0 C 92 0 90 40 100 40"
          fill="none"
          stroke="currentColor"
          className={active ? "text-primary/15" : "text-primary/8"}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Content */}
      <span
        className={[
          "relative z-10 px-4 pt-1.5 text-center text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-colors truncate w-full",
          active ? "text-primary" : "text-muted",
        ].join(" ")}
      >
        {children}
      </span>
    </Link>
  );
}

function StudentLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { profile, openProfile, profileModalProps } = useStudentProfile();
  const [showDailyNote, setShowDailyNote] = React.useState(false);
  const [dailyNote, setDailyNote] = React.useState(() => getStudentDailyNote());

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

  const tabs = [
    { href: "/", label: "Thông tin học viên", match: (p: string) => p === "/" || p.startsWith("/student") },
    { href: "/skill", label: "Thông tin khóa học", match: (p: string) => p === "/skill" || p === "/course-info" || p.startsWith("/course-info/") },
    { href: "/ho-tro-tu-hoc", label: "Hỗ trợ tự học", match: (p: string) => p === "/ho-tro-tu-hoc" || p.startsWith("/ho-tro-tu-hoc/") },
    { href: "/tai-lieu-them", label: "Kho tài liệu", match: (p: string) => p.startsWith("/tai-lieu-them") },
  ];

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (ALWAYS_SHOW_LOGIN_QUOTE) {
      setShowDailyNote(true);
      return;
    }
    const shouldShow = window.sessionStorage.getItem(LOGIN_QUOTE_POPUP_KEY) === "1";
    if (!shouldShow) return;
    setShowDailyNote(true);
    window.sessionStorage.removeItem(LOGIN_QUOTE_POPUP_KEY);
  }, []);

  React.useEffect(() => {
    const syncNote = () => setDailyNote(getStudentDailyNote());
    syncNote();
    window.addEventListener(STUDENT_DAILY_NOTE_UPDATE_EVENT, syncNote);
    window.addEventListener("storage", syncNote);
    return () => {
      window.removeEventListener(STUDENT_DAILY_NOTE_UPDATE_EVENT, syncNote);
      window.removeEventListener("storage", syncNote);
    };
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex min-h-screen w-full">
        {/* Left Sidebar */}
        <Sidebar onOpenProfile={openProfile} />

        {/* Main Content Area */}
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto md:pl-72">
          
          {/* Mobile Topbar */}
          <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-primary/10 bg-white/80 px-6 py-[18px] backdrop-blur-md md:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary"
                aria-label="Mở menu"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">
                  <span>Học viên</span>
                  <span className="text-border">/</span>
                  <span className="text-foreground/40">{pageTitle}</span>
                </div>
                <h1 className="text-xs font-black text-foreground tracking-tight leading-none mt-0.5">{pageTitle}</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={openProfile}
              className="relative group cursor-pointer"
              aria-label="Mở hồ sơ học viên"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-premium">
                <div className="w-full h-full rounded-[6px] bg-white overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xs font-black">
                      {profile.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border border-white"></div>
            </button>
          </header>

          {/* Main Folder Page */}
          <main className="flat-card-scope relative mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-6 md:px-8 flex flex-col">
            
            {/* Folder Tabs & Header Row */}
            <div className="flex items-end justify-between px-2 md:px-4 mb-0">
              {/* Left: Scrollable Folder Tabs */}
              <div className="flex items-end -mb-[1.5px] z-10 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 pr-4">
                {tabs.map((tab) => {
                  const active = tab.match(pathname);
                  return (
                    <FolderTab key={tab.href} href={tab.href} active={active}>
                      {tab.label}
                    </FolderTab>
                  );
                })}
              </div>

              {/* Right: Search & Profile Info (Desktop only) */}
              <div className="hidden md:flex items-center gap-6 pb-2 shrink-0">

                {/* Profile Details */}
                <div className="flex items-center gap-4 pl-6 border-l border-primary/15">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-foreground tracking-tight leading-none mb-1">{profile.name}</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none">IELTS Scholar</span>
                  </div>
                  <button
                    type="button"
                    onClick={openProfile}
                    className="relative group cursor-pointer"
                    aria-label="Mở hồ sơ học viên"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-premium group-hover:shadow-hover transition-all">
                      <div className="w-full h-full rounded-[10px] bg-white overflow-hidden">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-sm font-black">
                            {profile.name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-white"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Folder Body Card */}
            <div className="relative z-0 flex-1 bg-white border border-primary/10 rounded-b-3xl rounded-tr-3xl shadow-soft p-6 md:p-8 min-h-[600px] flex flex-col">
              <div className="flex-1 w-full min-w-0">
                {children}
              </div>
            </div>

          </main>
        </div>
      </div>
      
      {/* Mobile Drawer Sidebar */}
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
              {tabs.map((item) => {
                const active = item.match(pathname);
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
      
      {showDailyNote ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng note"
            onClick={() => setShowDailyNote(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />
          <div className="relative w-full max-w-2xl overflow-hidden shadow-2xl">
            <DailyNoteDisplay note={dailyNote} />
            <div
              className="flex justify-end border-t border-primary/10 px-6 py-4"
              style={{ backgroundColor: "var(--background)" }}
            >
              <button
                type="button"
                onClick={() => setShowDailyNote(false)}
                className="border border-primary/25 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary/5"
              >
                Bắt đầu học
              </button>
            </div>
          </div>
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

