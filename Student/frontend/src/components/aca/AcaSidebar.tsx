"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/aca", label: "Dashboard", desc: "Tổng quan" },
  { href: "/aca/quan-ly/noi-dung", label: "Quản lý nội dung", desc: "Duyệt & metadata" },
  { href: "/aca/quan-ly/mock-test", label: "Mock Test", desc: "Duyệt lịch & GV" },
  { href: "/aca/quan-ly/lop-luyen-de", label: "Lớp luyện đề", desc: "Lịch tuần" },
  { href: "/aca/quan-ly/bcb", label: "Chẩn đoán BCB", desc: "HV & khách" },
  { href: "/aca/quan-ly/chan-doan-khach", label: "Lead khách", desc: "Đăng ký tư vấn" },
  { href: "/aca/quan-ly/khoa-hoc", label: "Thông tin khóa", desc: "Metadata khóa" },
  { href: "/aca/quan-ly/note", label: "Note học viên", desc: "Word of the day" },
  { href: "/aca/quan-ly/nguoi-dung", label: "Người dùng", desc: "Tài khoản & quyền" },
  { href: "/aca/phan-tich", label: "Phân tích", desc: "Báo cáo & lọc" },
  { href: "/aca/he-thong", label: "Hệ thống", desc: "Danh mục & kiểm soát" },
];

export function AcaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-dvh w-72 p-4 md:block">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="flex shrink-0 items-center gap-3 px-5 py-5">
          <img src="/Logo_XLE.svg" alt="Logo XLE" className="h-8 w-auto object-contain" />
          <img src="/XALO.ENGLISH.svg" alt="Logo phụ âm bản" className="h-4 w-auto object-contain" />
        </div>

        <div className="mx-5 h-px shrink-0 bg-gradient-to-r from-transparent via-background to-transparent" />

        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1">
            <div className="sticky top-0 z-10 mb-1 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
              Academic / ACA
            </div>
            <div className="space-y-0.5">
              {nav.map((item) => {
                const active =
                  item.href === "/aca"
                    ? pathname === "/aca"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200",
                      active
                        ? "bg-primary text-white shadow-premium"
                        : "text-muted hover:bg-primary-soft/70 hover:text-foreground",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-200",
                        active
                          ? "bg-white/15 text-white"
                          : "bg-white text-primary group-hover:bg-primary-soft group-hover:text-primary",
                      ].join(" ")}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={active ? "2.5" : "2"}
                      >
                        <path d="M4 5h16v4H4zM4 11h16v8H4z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-xs font-bold leading-tight ${active ? "text-white" : "text-muted"}`}
                      >
                        {item.label}
                      </div>
                      <div
                        className={`truncate text-[10px] leading-tight ${active ? "text-white/80" : "text-zinc-500"}`}
                      >
                        {item.desc}
                      </div>
                    </div>
                    {active ? (
                      <div className="ml-1 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-2 shrink-0 space-y-0.5 border-t border-zinc-100 bg-white pt-3">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
              Tài khoản
            </div>
            <Link
              href="/aca/profile"
              className={[
                "flex items-center rounded-xl px-3 py-2.5 transition-all duration-200",
                pathname.startsWith("/aca/profile")
                  ? "bg-primary text-white shadow-premium"
                  : "text-muted hover:bg-primary-soft/70 hover:text-foreground",
              ].join(" ")}
            >
              <span className="text-xs font-bold">Hồ sơ ACA</span>
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
