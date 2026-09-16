"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GRADER_PATHS } from "@/lib/acaIdentity";

export default function GraderHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(GRADER_PATHS.writing);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm text-zinc-500 font-semibold">
      Đang chuyển hướng portal Grader…
    </div>
  );
}
