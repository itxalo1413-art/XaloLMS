"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/aca/quan-ly/lop-theo-thang", label: "Lớp tháng" },
  { href: "/aca/quan-ly/hoc-vien-lop", label: "Học viên" },
  { href: "/aca/quan-ly/cham-writing", label: "Chấm W" },
  { href: "/aca/quan-ly/diem-dau-vao-cuoi-khoa", label: "Bảng điểm" },
];

export function AcaMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-primary/15 bg-white/95 px-2 backdrop-blur-md md:hidden">
      <ul className="grid w-full grid-cols-4 gap-1">
        {items.map((item) => {
          const active =
            item.href === "/aca"
              ? pathname === "/aca"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "block rounded-lg px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide transition-colors",
                  active ? "bg-primary text-white" : "text-zinc-600 hover:bg-primary-soft",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
