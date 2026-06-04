"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageDecorations, DECOR_IMAGES } from "@/components/shared/PageDecorations";
import { Sidebar } from "@/components/student/Sidebar";
import { Topbar } from "@/components/student/Topbar";
import { ProfileModal } from "@/components/student/ProfileModal";
import { StudentAuthProvider } from "@/contexts/StudentAuthContext";
import { useStudentProfile } from "@/hooks/useStudentProfile";

const LOGIN_QUOTE_POPUP_KEY = "xalo.showLoginQuotePopup";
// true  => mỗi lần reload/layout mount đều hiện popup quote
// false => chỉ hiện 1 lần ngay sau login (logic hiện tại)
const ALWAYS_SHOW_LOGIN_QUOTE = true;

function StudentLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { profile, openProfile, profileModalProps } = useStudentProfile();
  const [showLoginQuote, setShowLoginQuote] = React.useState(false);
  const [quoteElementImage, setQuoteElementImage] = React.useState<string>(DECOR_IMAGES[0]);

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

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (ALWAYS_SHOW_LOGIN_QUOTE) {
      setShowLoginQuote(true);
      return;
    }
    const shouldShow = window.sessionStorage.getItem(LOGIN_QUOTE_POPUP_KEY) === "1";
    if (!shouldShow) return;
    setShowLoginQuote(true);
    window.sessionStorage.removeItem(LOGIN_QUOTE_POPUP_KEY);
  }, []);

  React.useEffect(() => {
    if (!showLoginQuote) return;
    const random = DECOR_IMAGES[Math.floor(Math.random() * DECOR_IMAGES.length)];
    setQuoteElementImage(random);
  }, [showLoginQuote]);

  return (
    <div className="min-h-screen bg-transparent">
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
          <main className="flat-card-scope relative mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-[18px] md:px-8">
            <PageDecorations seed={pathname || "/"} />
            <div className="relative z-10">{children}</div>
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
      {showLoginQuote ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng quote"
            onClick={() => setShowLoginQuote(false)}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />
          <div
            className="relative w-full max-w-2xl border border-primary/25 bg-transparent shadow-2xl"
            style={{
              backgroundImage: "url('/bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex items-start justify-between border-b border-primary/15 px-6 py-4">
              <div className="flex flex-col items-end gap-1">
                <img
                  src={quoteElementImage}
                  alt=""
                  role="presentation"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>
            <div className="space-y-5 px-6 py-6">
              <p className="text-lg font-bold leading-relaxed text-foreground">
                “Mỗi ngày tiến bộ 1% vẫn là tiến bộ. Học đều, luyện đúng trọng tâm, điểm số sẽ đi lên.”
              </p>
              <p className="text-sm font-semibold text-muted">
                Hôm nay bạn bắt đầu từ việc nhỏ: chọn 1 nhiệm vụ trong tab Hỗ trợ tự học và hoàn thành nó.
              </p>
            </div>
            <div className="border-t border-primary/15 px-6 py-4 text-right">
              <button
                type="button"
                onClick={() => setShowLoginQuote(false)}
                className="border border-primary/25 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5"
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
