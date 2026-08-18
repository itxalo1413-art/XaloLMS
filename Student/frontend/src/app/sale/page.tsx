"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SaleHomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sale/leads");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-48 text-slate-500 text-sm font-semibold animate-pulse">
      Đang chuyển hướng...
    </div>
  );
}
