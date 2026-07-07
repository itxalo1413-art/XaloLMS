"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const requiredLists = [
  { href: "/bd/quan-ly/diem-dau-vao-cuoi-khoa", label: "Điểm Entrance/Final", desc: "Bảng chẩn bệnh & tiến độ" },
];

export function BdSidebar() {
  const pathname = usePathname();

  const renderLink = (item: { href: string; label: string; desc: string }) => {
    const active = pathname.startsWith(item.href);
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
          <div className="min-w-0 flex-1">
            <img src="/XALO.ENGLISH.svg" alt="Logo Xa Lo" className="h-3 w-auto object-contain block" />
            <span className="text-[9px] font-black uppercase tracking-widest text-primary mt-1 block">
              BD / Sale Portal
            </span>
          </div>
        </div>

        <div className="mx-5 h-px shrink-0 bg-gradient-to-r from-transparent via-background to-transparent" />

        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 space-y-4">
            <div className="space-y-0.5">
              <div className="sticky top-0 z-10 mb-1 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                Chẩn bệnh khách hàng
              </div>
              {requiredLists.map(renderLink)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
