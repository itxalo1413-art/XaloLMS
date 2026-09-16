"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/teacher", label: "Lớp" },
  { href: "/teacher/rlp", label: "RLP" },
  { href: "/teacher/cham-writing", label: "Writing" },
  { href: "/teacher/final-test", label: "Final" },
  { href: "/teacher/lich", label: "Lịch" },
  { href: "/teacher/performance", label: "Perf" },
];

export function TeacherMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-primary/15 bg-white/95 px-2 backdrop-blur-md md:hidden">
      <ul className="flex w-full gap-1 overflow-x-auto">
        {items.map((item) => {
          const active =
            item.href === "/teacher"
              ? pathname === "/teacher" || pathname.startsWith("/teacher/hoc-sinh")
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={[
                  "block rounded-lg px-2.5 py-2 text-center text-[10px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap",
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
