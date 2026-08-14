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
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-20 p-3 md:block">
      <div className="flex h-full flex-col items-center rounded-2xl bg-white shadow-xl border border-zinc-100/80 py-5">
        {/* Logo Section (Icon only) */}
        <Link
          href="/"
          aria-label="Về trang chủ"
          className="relative group mb-6 flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-105"
        >
          <img
            src="/Logo_XLE.svg"
            alt="Logo XLE"
            className="h-8 w-8 object-contain"
          />
          {/* Tooltip on Logo hover */}
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
            <span className="relative z-10">XA LỘ ENGLISH</span>
          </div>
        </Link>

        <div className="mb-6 h-px w-10 bg-gradient-to-r from-transparent via-zinc-200 to-transparent"></div>

        {/* Navigation items (Icons only with hover tooltip label) */}
        <nav className="flex min-h-0 flex-1 flex-col items-center gap-3 w-full px-2">
          {navItems.map(({ href, label, Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all"
              >
                <div
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 shadow-2xs",
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                      : "bg-zinc-50 text-zinc-500 hover:bg-primary/10 hover:text-primary hover:scale-105",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                </div>

                {/* Floating Tooltip Label on Hover */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
                  <span className="relative z-10">{label}</span>
                </div>
              </Link>
            );
          })}

          {/* Bottom Logout Button */}
          <div className="mt-auto pt-4 border-t border-zinc-100 w-full flex justify-center">
            <button
              type="button"
              onClick={logout}
              className="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 hover:scale-105 shadow-2xs">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>

              {/* Floating Tooltip Label on Hover */}
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center">
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-rose-600 rotate-45" />
                <span className="relative z-10">Đăng xuất</span>
              </div>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
