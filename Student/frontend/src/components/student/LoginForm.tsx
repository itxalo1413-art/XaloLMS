"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  cacheAuthUser,
  getAuthBypassUser,
  homePathForRole,
  isAuthDisabled,
  login,
  setAuthToken,
  type AuthUser,
} from "@/lib/auth";

const LOGIN_QUOTE_POPUP_KEY = "xalo.showLoginQuotePopup";

const DEMO_PROFILES: { name: string; email: string; role: "HS" | "ACA" | "GV"; label: string }[] = [
  { name: "Dương Ngọc Khôi Nguyên", email: "student.demo@xalo.local", role: "HS", label: "🎓 Học viên (Khôi Nguyên)" },
  { name: "Lê Nguyễn Khánh Thi", email: "aca@xaloenglish.vn", role: "ACA", label: "💼 ACA 1 (Khánh Thi)" },
  { name: "Nghiêm Doãn Quỳnh Châu", email: "aca2@xaloenglish.vn", role: "ACA", label: "💼 ACA 2 (Quỳnh Châu)" },
  { name: "Lê Minh Trang", email: "aca3@xaloenglish.vn", role: "ACA", label: "💼 ACA 3 (Minh Trang)" },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If already logged in and not switching accounts, redirect directly to their dashboard
    if (searchParams.get("switch") === "1") return;
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("xalo.auth.user") : null;
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser) as AuthUser;
        router.replace(user.role === "HS" ? "/" : homePathForRole(user.role));
      } catch {
        // ignore
      }
    }
  }, [router, searchParams]);

  const roleError = searchParams.get("error") === "role";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    roleError ? "Tài khoản này không phải học viên. Dùng cổng ACA/Giáo viên nếu có." : null,
  );

  const handleQuickLogin = (prof: typeof DEMO_PROFILES[0]) => {
    const userPayload: AuthUser = {
      id: prof.role === "HS" ? "demo-student-id" : `aca-id-${prof.name.toLowerCase().replace(/\s+/g, "-")}`,
      email: prof.email,
      name: prof.name,
      role: prof.role,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    cacheAuthUser(userPayload);
    setAuthToken("demo-bypass-token");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(LOGIN_QUOTE_POPUP_KEY, "1");
    }
    router.replace(prof.role === "HS" ? "/" : homePathForRole(prof.role));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email.trim(), password);
      setAuthToken(result.access_token);
      cacheAuthUser(result.user);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(LOGIN_QUOTE_POPUP_KEY, "1");
      }
      if (result.user.role !== "HS") {
        router.replace(homePathForRole(result.user.role));
        return;
      }
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#f6f7fb]">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden border border-zinc-200 bg-white shadow-xl">
        <section className="hidden lg:flex flex-col justify-between p-10 bg-[#6a5acd] text-white">
          <div>
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase">
              Xalo LMS
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight">
              Chào mừng bạn quay trở lại hệ thống học tập
            </h1>
            <p className="mt-4 text-sm text-zinc-300 leading-relaxed">
              Đăng nhập bằng tài khoản hoặc nhấp vào các nút **Đăng nhập nhanh (Quick Login)** để kiểm tra/đổi lịch thi của các ACA khác nhau.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Đăng nhập nhanh cho kiểm thử:</h3>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PROFILES.map((prof) => (
                <button
                  key={prof.email}
                  type="button"
                  onClick={() => handleQuickLogin(prof)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-[11px] font-black text-left text-white transition-all"
                >
                  {prof.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-zinc-900">Đăng nhập</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Nhập tài khoản của bạn hoặc dùng bảng đăng nhập nhanh bên trái.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="text-xs font-bold text-zinc-500 uppercase">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aca@xaloenglish.vn"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-[#6a5acd]"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-xs font-bold text-zinc-500 uppercase">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-[#6a5acd]"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-[#6a5acd] focus:ring-[#6a5acd]"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <button type="button" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#6a5acd] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5b4ac0] transition-colors disabled:opacity-60"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            {/* Quick login list for Mobile view */}
            <div className="mt-8 lg:hidden space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase">Đăng nhập nhanh</h3>
              <div className="grid grid-cols-1 gap-2">
                {DEMO_PROFILES.map((prof) => (
                  <button
                    key={prof.email}
                    type="button"
                    onClick={() => handleQuickLogin(prof)}
                    className="px-3 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-left text-zinc-700"
                  >
                    {prof.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
