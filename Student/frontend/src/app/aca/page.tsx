"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCachedAuthUser } from "@/lib/auth";
import { GRADER_PATHS, isAcaAcademicHead, isGraderUser } from "@/lib/acaIdentity";

export default function AcaHomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCachedAuthUser();
    if (isGraderUser(user) || !isAcaAcademicHead(user)) {
      router.replace(GRADER_PATHS.home);
    } else {
      router.replace("/aca/quan-ly/lop-theo-thang");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm text-zinc-500 font-semibold">
      Đang chuyển hướng...
    </div>
  );
}
