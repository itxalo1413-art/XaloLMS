"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStudentAuth } from "@/contexts/StudentAuthContext";
import { IconDashboard, IconDocs, IconInfo, IconSupport } from "./icons";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
  { href: "/", label: "Thông tin học viên", Icon: IconDashboard },
  { href: "/skill", label: "Thông tin khóa học", Icon: IconInfo },
  { href: "/ho-tro-tu-hoc", label: "Hỗ trợ tự học", Icon: IconSupport },
  { href: "/tai-lieu-them", label: "Kho tài liệu", Icon: IconDocs },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ onOpenProfile }: { onOpenProfile?: () => void }) {
  const pathname = usePathname();
  const { logout } = useStudentAuth();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 p-4 transition-all duration-300 md:block">
      <div className="h-full bg-white rounded-2xl shadow-soft flex flex-col overflow-hidden">
        {/* Logo Section */}
        <Link
          href="/"
          aria-label="Về trang chủ"
          className="mx-6 my-6 flex items-center gap-3 rounded-xl transition-opacity hover:opacity-80"
        >
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
        </Link>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-background to-transparent mb-4"></div>

        {/* Navigation: links grow; account block pinned to bottom */}
        <nav className="flex min-h-0 flex-1 flex-col px-3 pb-4">
          <div className="min-h-0 flex-1 space-y-2">
            <div className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
              Học tập
            </div>

            {navItems.map(({ href, label, Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                    active
                      ? "bg-primary text-white shadow-soft"
                      : "text-muted hover:bg-background hover:text-foreground",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white text-primary shadow-sm group-hover:bg-primary-soft",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className="text-xs font-bold">{label}</span>
                </Link>
              );
            })}
          </div>

          <div className="shrink-0 space-y-1 border-t border-zinc-100 pt-4">
            <div className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
              Tài khoản
            </div>
            {/* <button
              type="button"
              onClick={onOpenProfile}
              className="w-full group flex items-center gap-3 rounded-xl px-4 py-3 text-muted hover:text-foreground hover:bg-background transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-muted group-hover:text-foreground transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xs font-bold">Trang cá nhân</span>
            </button> */}
            <button
              type="button"
              onClick={logout}
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

        {/* Footer Support Card */}
        {/* <div className="p-4 mt-auto">
          <div className="relative rounded-2xl bg-primary p-5 shadow-premium overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3 text-white">
                <IconInfo className="w-4 h-4" />
              </div>
              <h4 className="text-white text-xs font-bold mb-1">Cần hỗ trợ?</h4>
              <p className="text-white/50 text-[10px] leading-relaxed mb-4">
                Đội ngũ Xalo luôn sẵn sàng giải đáp thắc mắc của bạn.
              </p>
              <button className="w-full py-2 bg-white text-primary text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95">
                Nhắn tin ngay
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </aside>
  );
}

