import { Suspense } from "react";
import { LoginForm } from "@/components/student/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] text-sm text-zinc-500">
          Đang tải...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
