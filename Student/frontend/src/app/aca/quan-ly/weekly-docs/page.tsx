"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Weekly Docs đã gộp vào cột Link folder của Lớp luyện đề tuần. */
export default function WeeklyDocsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/aca/quan-ly/lop-luyen-de-tuan");
  }, [router]);
  return (
    <div className="p-12 text-center text-xs font-bold text-zinc-400">
      Đang chuyển sang Lớp luyện đề tuần…
    </div>
  );
}
