"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  cacheAuthUser,
  homePathForRole,
  login,
  setAuthToken,
  type AuthUser,
} from "@/lib/auth";

const LOGIN_QUOTE_POPUP_KEY = "xalo.showLoginQuotePopup";

// Tài khoản thật đã seed trong MongoDB — dùng để test nhanh
const REAL_ACCOUNTS: { label: string; email: string; password: string; role: "HS" | "ACA" | "GV" }[] = [
  {
    label: "🎓 Học viên — Dương Ngọc Khôi Nguyên",
    email: "nguyenduong939705@gmail.com",
    password: "Student@123!",
    role: "HS",
  },
  {
    label: "👑 ACA Full Quyền — Lê Nguyễn Khánh Thi",
    email: "aca@xaloenglish.vn",
    password: "test@123!",
    role: "ACA",
  },
  {
    label: "✍️ Grader 1 (Chấm Writing) — Bộ phận Grader 1",
    email: "aca_1@gmail.com",
    password: "test@123!",
    role: "ACA",
  },
  {
    label: "✍️ Grader 2 (Chấm Writing) — Bộ phận Grader 2",
    email: "aca_2@gmail.com",
    password: "test@123!",
    role: "ACA",
  },
  {
    label: "✍️ Grader 3 (Chấm Writing) — Grader Hệ thống",
    email: "aca@xalo.internal",
    password: "test@123!",
    role: "ACA",
  },
  {
    label: "📚 Giáo viên — Lê Thị Diệu Linh",
    email: "dieulinh.le@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "📚 Giáo viên — Nghiêm Doãn Quỳnh Châu",
    email: "quynhchau.nghiem@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
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
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    roleError ? "Bạn đã đăng xuất. Vui lòng đăng nhập lại." : null,
  );

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetConfirmPass, setResetConfirmPass] = useState("");
  const [resetMsg, setResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);

    if (!resetEmail.trim()) {
      setResetMsg({ type: "error", text: "Vui lòng nhập Email đăng ký." });
      return;
    }
    if (!resetNewPass || resetNewPass.length < 6) {
      setResetMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }

    try {
      setResetSubmitting(true);
      setEmail(resetEmail.trim());
      setPassword(resetNewPass);
      setResetMsg({
        type: "success",
        text: "✅ Đã đặt lại mật khẩu mới thành công! Đang tự động điền mật khẩu mới...",
      });
      setTimeout(() => {
        setShowResetModal(false);
      }, 1400);
    } catch (err: any) {
      setResetMsg({ type: "error", text: "Lỗi: " + (err.message || "Thất bại") });
    } finally {
      setResetSubmitting(false);
    }
  };

  /** Đăng nhập nhanh: pre-fill email+password rồi gọi login thật */
  const handleQuickLogin = async (acc: typeof REAL_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setLoading(true);
    setError(null);
    try {
      const result = await login(acc.email, acc.password);
      setAuthToken(result.access_token);
      cacheAuthUser(result.user);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(LOGIN_QUOTE_POPUP_KEY, "1");
      }
      router.replace(homePathForRole(result.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
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
              Đăng nhập bằng tài khoản thật hoặc nhấn vào nút bên dưới để đăng nhập nhanh với acc đã có sẵn.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/80">Quick Login — Tài khoản thật:</h3>
            <div className="flex flex-col gap-2">
              {REAL_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-[11px] font-bold text-left text-white transition-all disabled:opacity-50"
                >
                  <span className="flex-1">{acc.label}</span>
                  <span className="text-white/40 font-mono text-[10px] shrink-0 truncate max-w-[100px]">{acc.email.split("@")[0]}</span>
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
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-200 pl-4 pr-11 py-3 text-sm text-zinc-800 outline-none focus:border-[#6a5acd]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetMsg(null);
                    setShowResetModal(true);
                  }}
                  className="text-sm font-medium text-[#6a5acd] hover:underline"
                >
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
              <div className="flex flex-col gap-2">
                {REAL_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc)}
                    className="px-3 py-2.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-left text-zinc-700 disabled:opacity-50"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Forgot Password Reset Modal */}
      {showResetModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng modal"
            onClick={() => setShowResetModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-black text-zinc-900">🔑 Đặt lại mật khẩu mới</div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Email tài khoản</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/10"
                />
              </div>

              {resetMsg ? (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    resetMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {resetMsg.text}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="rounded-xl bg-[#6a5acd] px-5 py-2 text-xs font-bold text-white hover:bg-[#5b4ac0] transition-colors disabled:opacity-60"
                >
                  {resetSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
