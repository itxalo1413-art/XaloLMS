"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  cacheAuthUser,
  clearAuthToken,
  fetchMe,
  getAuthToken,
  getCachedAuthUser,
  homePathForUser,
  isAuthDisabled,
  isAuthSessionError,
  login,
  setAuthToken,
} from "@/lib/auth";

const LOGIN_QUOTE_POPUP_KEY = "xalo.showLoginQuotePopup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("switch") === "1") return;
    if (isAuthDisabled()) return;

    const token = getAuthToken();
    const cached = getCachedAuthUser();
    if (!token || !cached) {
      if (!token && cached) clearAuthToken();
      return;
    }

    let cancelled = false;
    void fetchMe()
      .then((me) => {
        if (cancelled) return;
        cacheAuthUser(me);
        setAuthToken(token);
        router.replace(me.role === "HS" ? "/" : homePathForUser(me));
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAuthSessionError(err)) {
          clearAuthToken();
        }
      });

    return () => {
      cancelled = true;
    };
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
        text: "Đã đặt lại mật khẩu mới thành công! Đang tự động điền mật khẩu...",
      });
      setTimeout(() => {
        setShowResetModal(false);
      }, 1400);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Thất bại";
      setResetMsg({ type: "error", text: "Lỗi: " + message });
    } finally {
      setResetSubmitting(false);
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
        router.replace(homePathForUser(result.user));
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#f6f7fb] font-sans">
      {/* Main Container Card */}
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden border border-zinc-200/80 bg-white shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left Side: Brand Panel */}
        <section className="lg:col-span-5 p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-[#6a5acd] via-[#7b61ff] to-[#5b4ac0] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-950/30 blur-3xl" />

          <div className="relative z-10">
            {/* Header Brand */}
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-2 shadow-sm flex items-center justify-center">
                <img
                  src="/Logo_XLE.svg"
                  alt="Xa Lộ English Logo"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-xs border border-white/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                Xalo LMS
              </span>
            </div>

            <h1 className="mt-8 text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
              Hệ thống Quản lý Học tập Xa Lộ English
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              Nền tảng đào tạo và khảo thí IELTS toàn diện dành cho Học viên, Giảng viên và Cán bộ Học vụ.
            </p>


          </div>

          {/* Footer Info */}
          <div className="relative z-10 pt-6 mt-8 border-t border-white/15 text-xs text-white/70 flex items-center justify-between">
            <span>© 2026 Xa Lộ English</span>
            <span className="font-semibold text-white/90">LMS Portal</span>
          </div>
        </section>

        {/* Right Side: Clean Modern Login Form */}
        <section className="lg:col-span-7 p-8 sm:p-12 lg:p-14 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
                Đăng nhập
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-zinc-500 font-medium">
                Vui lòng nhập Email và Mật khẩu tài khoản của bạn để tiếp tục.
              </p>
            </div>

            {/* Error Alert */}
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
                <svg className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            ) : null}

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nhap-email@xalo.edu.vn"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-3 text-sm text-zinc-900 font-medium outline-none transition-all focus:border-[#7b61ff] focus:bg-white focus:ring-4 focus:ring-[#7b61ff]/10 placeholder:text-zinc-400"
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-11 py-3 text-sm text-zinc-900 font-medium outline-none transition-all focus:border-[#7b61ff] focus:bg-white focus:ring-4 focus:ring-[#7b61ff]/10 placeholder:text-zinc-400"
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors cursor-pointer"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-[#7b61ff] focus:ring-[#7b61ff]"
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
                  className="text-xs font-bold text-[#7b61ff] hover:text-[#5b4ac0] hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#7b61ff] hover:bg-[#6a5acd] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <span>Đăng nhập ngay</span>
                )}
              </button>
            </form>

            {/* Help Support Footer */}
            <div className="pt-4 text-center">
              <p className="text-xs text-zinc-500">
                Chưa có tài khoản hoặc gặp sự cố đăng nhập?{" "}
                <span className="font-semibold text-[#7b61ff]">Liên hệ Giáo vụ (ACA)</span> để được hỗ trợ.
              </p>
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
              <div className="text-base font-black text-zinc-900">Đặt lại mật khẩu mới</div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-[#7b61ff] focus:ring-2 focus:ring-[#7b61ff]/10"
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
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-[#7b61ff] focus:ring-2 focus:ring-[#7b61ff]/10"
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
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-[#7b61ff] focus:ring-2 focus:ring-[#7b61ff]/10"
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
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="rounded-xl bg-[#7b61ff] px-5 py-2 text-xs font-bold text-white hover:bg-[#6a5acd] transition-colors disabled:opacity-60"
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
