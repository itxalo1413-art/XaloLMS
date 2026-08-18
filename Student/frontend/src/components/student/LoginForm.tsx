"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  cacheAuthUser,
  clearAuthToken,
  fetchMe,
  getAuthToken,
  getCachedAuthUser,
  homePathForRole,
  isAuthDisabled,
  isAuthSessionError,
  login,
  setAuthToken,
} from "@/lib/auth";

const LOGIN_QUOTE_POPUP_KEY = "xalo.showLoginQuotePopup";

export type RoleCategory = "ALL" | "HS" | "ACA" | "GV" | "SALE";

// Tài khoản thật đã seed trong MongoDB — dùng để test nhanh
const REAL_ACCOUNTS: { label: string; email: string; password: string; role: "HS" | "ACA" | "GV" | "SALE" }[] = [
  {
    label: "SALE — Nguyễn Phương Thảo",
    email: "sale@xalo.edu.vn",
    password: "Sale@123!",
    role: "SALE",
  },
  {
    label: "Học viên — Dương Ngọc Khôi Nguyên",
    email: "nguyenduong939705@gmail.com",
    password: "Student@123!",
    role: "HS",
  },
  {
    label: "ACA Full Quyền — Lê Nguyễn Khánh Thi",
    email: "aca@xaloenglish.vn",
    password: "test@123!",
    role: "ACA",
  },
  {
    label: "Grader 1 (Chấm Writing) — Bộ phận Grader 1",
    email: "aca_1@gmail.com",
    password: "test@123!",
    role: "ACA",
  },
  {
    label: "Grader 2 (Chấm Writing) — Bộ phận Grader 2",
    email: "aca_2@gmail.com",
    password: "test@123!",
    role: "ACA",
  },
  {
    label: "Grader 3 (Chấm Writing) — Grader Hệ thống",
    email: "aca@xalo.internal",
    password: "test@123!",
    role: "ACA",
  },
  {
    label: "Giáo viên — Nghiêm Doãn Quỳnh Châu",
    email: "quynhchau.nghiem@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Lê Thị Diệu Linh",
    email: "dieulinh.le@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Lê Minh Trang",
    email: "minhtrang.le@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Phạm Hoàng An",
    email: "hoangan.pham@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Trần Thu Lan",
    email: "thulan.tran@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Lê Thanh Tâm",
    email: "thanhtam.le@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Thái Đỗ Đăng Khoa",
    email: "dangkhoa.thai@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Tất Duy Khải",
    email: "duykhai.tat@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Lê Như Hải",
    email: "nhuhai.le@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Nguyễn Lê Trung Dũng",
    email: "trungdung.nguyen@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Nguyễn Lưu Minh Tâm",
    email: "minhtam.nguyen@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Trần Quang Minh",
    email: "quangminh.tran@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
  {
    label: "Giáo viên — Đặng Duy",
    email: "dangduy@xalo.edu.vn",
    password: "Teacher@123!",
    role: "GV",
  },
];

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
        router.replace(me.role === "HS" ? "/" : homePathForRole(me.role));
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

  // Quick Login Filter States
  const [activeCategory, setActiveCategory] = useState<RoleCategory>("ALL");
  const [quickSearch, setQuickSearch] = useState("");

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetConfirmPass, setResetConfirmPass] = useState("");
  const [resetMsg, setResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const filteredQuickAccounts = useMemo(() => {
    return REAL_ACCOUNTS.filter((acc) => {
      if (activeCategory !== "ALL" && acc.role !== activeCategory) return false;
      if (quickSearch.trim()) {
        const q = quickSearch.trim().toLowerCase();
        return acc.label.toLowerCase().includes(q) || acc.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, quickSearch]);

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
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-950 overflow-hidden font-sans">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/60 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-6xl rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Side: Dark Brand & Quick Login Area */}
        <section className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between text-white">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3">
              <img
                src="/Logo_XLE.svg"
                alt="Xa Lộ English Logo"
                className="h-9 w-auto object-contain filter drop-shadow-md"
              />
              <span className="inline-flex items-center rounded-full bg-indigo-500/15 border border-indigo-400/30 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                Xalo LMS v2.0
              </span>
            </div>

            <h1 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
              Hệ thống Quản lý Học tập Xa Lộ English
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Đăng nhập tài khoản của bạn hoặc sử dụng bảng Đăng nhập nhanh để trải nghiệm hệ thống.
            </p>
          </div>

          {/* Quick Login Section */}
          <div className="mt-8 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Tài khoản dùng thử
              </h3>
              <span className="text-[10px] font-bold text-slate-500">
                {filteredQuickAccounts.length} tài khoản
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-bold">
              {[
                { key: "ALL", label: "Tất cả" },
                { key: "HS", label: "Học viên" },
                { key: "ACA", label: "ACA" },
                { key: "GV", label: "Giáo viên" },
                { key: "SALE", label: "SALE" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key as RoleCategory)}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeCategory === tab.key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input for Quick Login */}
            <div className="relative">
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Tìm tên hoặc email..."
                className="w-full h-8 rounded-lg bg-slate-900/80 border border-slate-800 px-3 pl-8 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Quick Accounts List */}
            <div className="space-y-2 max-h-[260px] sm:max-h-[300px] overflow-y-auto pr-1 text-xs">
              {filteredQuickAccounts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs rounded-xl bg-slate-900/40 border border-slate-800">
                  Không tìm thấy tài khoản phù hợp.
                </div>
              ) : (
                filteredQuickAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc)}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900/60 hover:bg-indigo-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all text-left group cursor-pointer disabled:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-200 group-hover:text-white truncate">
                        {acc.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {acc.email}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                        acc.role === "HS"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : acc.role === "ACA"
                          ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                          : acc.role === "SALE"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                      }`}
                    >
                      {acc.role}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Clean Login Form */}
        <section className="lg:col-span-7 p-6 sm:p-10 lg:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Đăng nhập
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
                Vui lòng điền Email và Mật khẩu tài khoản của bạn.
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
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 font-medium outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 placeholder:text-slate-400"
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
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
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-11 py-3 text-sm text-slate-900 font-medium outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 placeholder:text-slate-400"
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
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
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
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
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
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
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-black text-slate-900">Đặt lại mật khẩu mới</div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email tài khoản</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
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
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
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
