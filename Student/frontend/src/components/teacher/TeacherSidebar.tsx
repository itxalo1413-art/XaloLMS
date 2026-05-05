"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/teacher", label: "Danh sách học sinh" },
  { href: "/teacher/mock-test", label: "Lịch Mock Test" },
];

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-200/80 bg-white">
      <div className="border-b border-zinc-100 px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6a5acd] text-sm font-black text-white">
            X
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900">Xalo LMS</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6a5acd]">
              Giáo viên
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {items.map(({ href, label }) => {
          const active =
            href === "/teacher"
              ? pathname === "/teacher" || pathname.startsWith("/teacher/hoc-sinh")
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#efeaff] text-[#4b3fb3]"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-100 p-4">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Xem nhanh — cập nhật nhanh — rời đi nhanh.
        </p>
      </div>
    </aside>
  );
}
