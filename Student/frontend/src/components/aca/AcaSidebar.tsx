"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/aca", label: "Dashboard", desc: "Tổng quan" },
  { href: "/aca/quan-ly/noi-dung", label: "Quản lý nội dung", desc: "Duyệt & metadata" },
  { href: "/aca/quan-ly/mock-test", label: "Mock Test", desc: "Duyệt lịch & GV" },
  { href: "/aca/quan-ly/nguoi-dung", label: "Người dùng", desc: "Tài khoản & quyền" },
  { href: "/aca/phan-tich", label: "Phân tích", desc: "Báo cáo & lọc" },
  { href: "/aca/he-thong", label: "Hệ thống", desc: "Danh mục & kiểm soát" },
];

export function AcaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-200/80 bg-white">
      <div className="border-b border-zinc-100 px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6a5acd] text-sm font-black text-white">
            A
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900">Xalo LMS</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6a5acd]">
              Academic / ACA
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
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
                "rounded-lg px-3 py-2.5 transition-colors",
                active
                  ? "bg-[#efeaff]"
                  : "hover:bg-zinc-50",
              ].join(" ")}
            >
              <div
                className={`text-sm font-semibold ${active ? "text-[#4b3fb3]" : "text-zinc-900"}`}
              >
                {item.label}
              </div>
              <div className="text-[10px] text-zinc-500">{item.desc}</div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-100 p-4">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Observability-first — ít thao tác, nhiều tín hiệu.
        </p>
      </div>
    </aside>
  );
}
