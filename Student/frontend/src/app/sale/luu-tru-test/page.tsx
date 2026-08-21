"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SaleLuuTruTestRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sale/dat-lich-test");
  }, [router]);

  return null;
}
