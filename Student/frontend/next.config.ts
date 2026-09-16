import type { NextConfig } from "next";

const rawUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://127.0.0.1:5001";

const backendUrl = rawUrl.trim().replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Ẩn badge "N" (Next.js Dev Tools) góc trái dưới khi chạy dev — tiện chụp màn hình.
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
