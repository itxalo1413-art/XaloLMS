"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const requiredLists = [
  { href: "/aca/quan-ly/lop-theo-thang", label: "Lớp theo tháng", desc: "DS & số lượng lớp" },
  { href: "/aca/quan-ly/hoc-vien-lop", label: "Danh sách học viên", desc: "Thông tin & điểm số đầy đủ" },
  { href: "/aca/quan-ly/diem-dau-vao-cuoi-khoa", label: "Điểm Entrance/Final", desc: "Bảng điểm & tiến độ" },
  { href: "/aca/quan-ly/lop-1-1", label: "Lớp 1:1", desc: "Lịch kèm cá nhân" },
  { href: "/aca/quan-ly/lop-luyen-de-tuan", label: "Lớp luyện đề tuần", desc: "Lịch đề theo tuần" },
  { href: "/aca/quan-ly/thong-ke-luyen-de", label: "Thống kê luyện đề", desc: "Báo cáo & số liệu đề thường" },
];

const systemModules = [
  { href: "/aca/quan-ly/mock-test", label: "Duyệt Mock Test", desc: "Xếp lịch & ca rảnh Speaking" },
  { href: "/aca/quan-ly/lich-ranh", label: "Lịch rảnh ACA", desc: "Set lịch rảnh Speaking" },
  { href: "/aca/quan-ly/cham-writing", label: "Chấm Writing", desc: "Quản lý & chấm bài Writing" },
  { href: "/aca/quan-ly/cham-speaking", label: "Chấm Speaking", desc: "Quản lý lịch & link Meet/Zoom Speaking" },
  { href: "/aca/nhan-bai-luyen-de", label: "Nhận bài & Cấp độ", desc: "Nhận bài làm & Giao GV" },
];

export function AcaSidebar() {
  const pathname = usePathname();

  const renderLink = (item: { href: string; label: string; desc: string }) => {
    const active =
      item.href === "/aca"
        ? pathname === "/aca"
        : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={[
          "group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-200",
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
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-dvh w-72 p-4 md:block">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="flex shrink-0 items-center gap-3 px-5 py-5">
          <img src="/Logo_XLE.svg" alt="Logo XLE" className="h-8 w-auto object-contain" />
          <img src="/XALO.ENGLISH.svg" alt="Logo phụ âm bản" className="h-4 w-auto object-contain" />
        </div>

        <div className="mx-5 h-px shrink-0 bg-gradient-to-r from-transparent via-background to-transparent" />

        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 space-y-4">
            
            {/* Group 1: Danh sách cần có */}
            <div className="space-y-0.5">
              <div className="sticky top-0 z-10 mb-1 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                Danh sách quản lý
              </div>
              {requiredLists.map(renderLink)}
            </div>

            {/* Group 2: Hệ thống / Website */}
            <div className="space-y-0.5">
              <div className="sticky top-0 z-10 mb-1 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                Hệ thống & Module
              </div>
              {systemModules.map(renderLink)}
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
