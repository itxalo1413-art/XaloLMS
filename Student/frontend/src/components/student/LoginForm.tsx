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
} from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isAuthDisabled()) return;
    const demo = getAuthBypassUser();
    cacheAuthUser(demo);
    router.replace("/");
  }, [router]);
  const roleError = searchParams.get("error") === "role";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    roleError ? "Tài khoản này không phải học viên. Dùng cổng ACA/Giáo viên nếu có." : null,
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email.trim(), password);
      setAuthToken(result.access_token);
      cacheAuthUser(result.user);
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
              Đăng nhập để tiếp tục theo dõi tiến độ, xem tài liệu và cập nhật trạng thái học tập của bạn.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li>• Theo dõi nội dung đã học</li>
            <li>• Tìm tài liệu nhanh trong thư viện</li>
            <li>• Tiếp tục học tại vị trí đang dở</li>
          </ul>
        </section>

        <section className="p-8 sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-zinc-900">Đăng nhập</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Nhập tài khoản học viên (HS) do học vụ cấp.
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
                  placeholder="nguyenduong939705@gmail.com"
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

            <p className="mt-6 text-center text-xs text-zinc-500">
              Tài khoản demo (sau khi seed backend): email trong STUDENT_SEED_EMAIL, mật khẩu
              STUDENT_SEED_PASSWORD.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
