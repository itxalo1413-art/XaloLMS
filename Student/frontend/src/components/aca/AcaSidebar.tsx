"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCachedAuthUser, clearAuthToken, isAuthDisabled } from "@/lib/auth";

const requiredLists = [
  { href: "/aca/quan-ly/lop-theo-thang", label: "Lớp theo tháng", desc: "DS & số lượng lớp" },
  { href: "/aca/quan-ly/hoc-vien-lop", label: "Danh sách học viên", desc: "Thông tin & điểm số đầy đủ" },
  { href: "/aca/quan-ly/diem-dau-vao-cuoi-khoa", label: "Điểm Entrance/Final", desc: "Bảng điểm & tiến độ" },
  { href: "/aca/quan-ly/bcb-final", label: "BCB Final", desc: "Quản lý & duyệt trả BCB Final" },
  { href: "/aca/quan-ly/luu-tru-test", label: "Lưu trữ bài test", desc: "Quản lý ca thi & hồ sơ BCB" },
  { href: "/aca/quan-ly/test-speaking", label: "Đăng ký Speaking", desc: "DS đăng ký & Grader phụ trách" },
  { href: "/aca/quan-ly/phan-tich-final-test", label: "Phân tích Final Test", desc: "Tỷ lệ đạt theo phân loại lớp" },
  { href: "/aca/quan-ly/lop-1-1", label: "Lớp 1:1", desc: "Lịch kèm cá nhân" },
  { href: "/aca/quan-ly/lop-luyen-de-tuan", label: "Lớp luyện đề tuần", desc: "Lịch đề theo tuần" },
  { href: "/aca/quan-ly/thong-ke-luyen-de", label: "Thống kê luyện đề", desc: "Báo cáo & số liệu đề thường" },
  { href: "/aca/quan-ly/giao-vien", label: "Hiệu suất Giáo viên", desc: "Thống kê chấm bài trễ hạn" },
  { href: "/aca/quan-ly/khoa-hoc", label: "Thông tin khóa học", desc: "Tài nguyên & metadata lớp" },
  { href: "/aca/quan-ly/note", label: "Quotes & Note học viên", desc: "Quản lý quote random & note" },
];

const systemModules = [
  { href: "/aca/quan-ly/cham-writing", label: "Chấm Writing", desc: "Quản lý & chấm bài Writing" },
];

const graderModules = [
  { href: "/aca/quan-ly/cham-writing", label: "Chấm Writing", desc: "Quản lý & chấm bài Writing" },
  { href: "/aca/quan-ly/test-speaking", label: "Test Speaking", desc: "Chấm ca Mock Test Speaking" },
  { href: "/aca/quan-ly/lich-ranh", label: "Đăng ký lịch rảnh", desc: "Daily schedule & lịch rảnh Grader" },
];


export function AcaSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // Keep SSR + first client paint identical; resolve role only after mount.
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isKhanhThi, setIsKhanhThi] = useState(false);

  const handleLogout = () => {
    if (isAuthDisabled()) {
      router.replace("/");
      return;
    }
    clearAuthToken();
    router.replace("/login");
  };

  useEffect(() => {
    const loggedInUser = getCachedAuthUser();
    setUser(loggedInUser);
    
    const name = (loggedInUser?.name || "").trim().toLowerCase();
    const email = (loggedInUser?.email || "").trim().toLowerCase();
    
    setIsKhanhThi(
      name === "lê nguyễn khánh thi" ||
        name.includes("khánh thi") ||
        email === "aca@xaloenglish.vn",
    );
    setReady(true);
  }, [pathname]);

  const showRequiredLists = ready && isKhanhThi;

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
          <p className="font-bold">Xa Lộ English</p>
        </div>

        <div className="mx-5 h-px shrink-0 bg-gradient-to-r from-transparent via-background to-transparent" />

        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 space-y-4">
            {showRequiredLists ? (
              <div className="space-y-0.5">
                <div className="sticky top-0 z-10 mb-1 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Danh sách quản lý Grader
                </div>
                {requiredLists.map(renderLink)}
                <div className="sticky top-0 z-10 mb-1 mt-3 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Hỗ trợ Chấm W-S
                </div>
                {systemModules.map(renderLink)}
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="sticky top-0 z-10 mb-1 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Công cụ Grader
                </div>
                {graderModules.map(renderLink)}
              </div>
            )}
          </div>

          <div className="mt-2 shrink-0 space-y-0.5 border-t border-zinc-100 bg-white pt-3">
            {ready && user && (
              <div className="mb-3 mx-1 px-3 py-2.5 bg-purple-50/60 border border-purple-100 rounded-xl flex items-center gap-2.5">
                <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[11px] font-black text-white uppercase shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-black text-foreground">{user.name}</div>
                  <div className="text-[9px] font-bold text-purple-700 uppercase tracking-wider">
                    {isKhanhThi ? "HỌC VỤ TRƯỞNG" : "GRADER"}
                  </div>
                </div>
              </div>
            )}

            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
              Tài khoản
            </div>
            <Link
              href="/aca/profile"
              className={[
                "group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-200",
                pathname.startsWith("/aca/profile")
                  ? "bg-primary text-white shadow-premium"
                  : "text-muted hover:bg-primary-soft/70 hover:text-foreground",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-200",
                  pathname.startsWith("/aca/profile")
                    ? "bg-white/15 text-white"
                    : "bg-white text-primary group-hover:bg-primary-soft group-hover:text-primary",
                ].join(" ")}
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={pathname.startsWith("/aca/profile") ? "2.5" : "2"}
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-xs font-bold leading-tight ${
                    pathname.startsWith("/aca/profile") ? "text-white" : "text-muted"
                  }`}
                >
                  Hồ sơ ACA
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-muted transition-all duration-200 hover:bg-primary-soft/70 hover:text-foreground"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-primary group-hover:bg-primary-soft group-hover:text-primary shadow-sm transition-all duration-200">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-xs font-bold leading-tight">
                  Đăng xuất
                </div>
              </div>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
