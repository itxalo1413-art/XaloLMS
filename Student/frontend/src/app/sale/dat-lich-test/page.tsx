"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const type = searchParams.get("type");
    router.replace(type === "writing" ? "/sale/cham-writing" : "/sale/test-speaking");
  }, [router, searchParams]);
  return (
    <div className="flex items-center justify-center h-48 text-slate-500 text-sm font-semibold animate-pulse">
      Đang chuyển hướng...
    </div>
  );
}

export default function SaleDatLichTestRedirectPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-zinc-400 text-xs font-bold">Đang tải...</div>}>
      <RedirectInner />
    </Suspense>
  );
}
