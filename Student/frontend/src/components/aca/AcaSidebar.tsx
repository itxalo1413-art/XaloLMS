"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/aca", label: "Dashboard", desc: "Tổng quan" },
  { href: "/aca/quan-ly/noi-dung", label: "Quản lý nội dung", desc: "Duyệt & metadata" },
  { href: "/aca/quan-ly/mock-test", label: "Mock Test", desc: "Duyệt lịch & GV" },
  { href: "/aca/quan-ly/lop-luyen-de", label: "Lớp luyện đề", desc: "Lịch tuần" },
  { href: "/aca/quan-ly/chan-doan-khach", label: "Chẩn đoán khách", desc: "Lead tư vấn" },
  { href: "/aca/quan-ly/khoa-hoc", label: "Thông tin khóa", desc: "Metadata khóa" },
  { href: "/aca/quan-ly/nguoi-dung", label: "Người dùng", desc: "Tài khoản & quyền" },
  { href: "/aca/phan-tich", label: "Phân tích", desc: "Báo cáo & lọc" },
  { href: "/aca/he-thong", label: "Hệ thống", desc: "Danh mục & kiểm soát" },
];

export function AcaSidebar() {
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
              Academic / ACA
            </div>
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
                      <path d="M4 5h16v4H4zM4 11h16v8H4z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className={`truncate text-xs font-bold transition-colors ${active ? "text-white" : "text-muted"}`}>
                      {item.label}
                    </div>
                    <div className={`truncate text-[10px] ${active ? "text-white/80" : "text-zinc-500"}`}>{item.desc}</div>
                  </div>
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
              href="/aca/profile"
              className={[
                "group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300",
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
