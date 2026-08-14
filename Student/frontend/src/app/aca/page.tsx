"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCachedAuthUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCachedAuthUser();
    const name = (user?.name || "").trim().toLowerCase();
    const email = (user?.email || "").trim().toLowerCase();

    const isKhanhThi =
      name === "lê nguyễn khánh thi" ||
      name.includes("khánh thi") ||
      email === "aca@xaloenglish.vn";

    if (isKhanhThi) {
      router.replace("/aca/quan-ly/lop-theo-thang");
    } else {
      router.replace("/aca/quan-ly/cham-writing");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm text-zinc-500 font-semibold">
      Đang chuyển hướng...
    </div>
  );
}
