"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BdDauVaoCuoiKhoaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/aca/quan-ly/diem-dau-vao-cuoi-khoa");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-zinc-500">
      Đang chuyển hướng sang trang Quản lý Điểm Entrance/Final của ACA...
    </div>
  );
}
