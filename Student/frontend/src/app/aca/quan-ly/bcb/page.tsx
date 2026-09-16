"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AcaBcbRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    if (studentId) {
      router.replace(`/sale/bcb?studentId=${studentId}`);
    } else {
      router.replace("/sale/bcb");
    }
  }, [router, studentId]);

  return (
    <div className="flex h-64 items-center justify-center text-xs font-bold text-zinc-400 animate-pulse">
      Đang chuyển hướng sang trang Quản lý Bảng Chẩn Bệnh (BCB) của Sale...
    </div>
  );
}

export default function AcaBcbPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-zinc-400">Đang chuyển hướng...</div>}>
      <AcaBcbRedirectContent />
    </Suspense>
  );
}
