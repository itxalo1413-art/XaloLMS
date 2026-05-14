import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#f6f7fb]">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden border border-zinc-200 bg-white shadow-xl">
        <section className="hidden lg:flex flex-col justify-between p-10 bg-[#6a5acd] text-white">
          <div>
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase  ">
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
                Nhập thông tin tài khoản học viên của bạn.
              </p>
            </div>

            <form className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="text-xs font-bold text-zinc-500 uppercase  "
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ten@vidu.com"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-[#6a5acd]"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-zinc-500 uppercase  "
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none focus:border-[#6a5acd]"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-[#6a5acd] focus:ring-[#6a5acd]"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="button"
                className="w-full rounded-xl bg-[#6a5acd] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5b4ac0] transition-colors"
              >
                Đăng nhập
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-600">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                className="font-semibold text-[#6a5acd] hover:underline"
              >
                Liên hệ học vụ
              </button>
            </div>

            <div className="mt-8 border-t border-zinc-100 pt-6">
              <Link
                href="/"
                className="inline-flex rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Về trang demo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
