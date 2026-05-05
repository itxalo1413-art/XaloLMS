import type { ReactNode } from "react";
import { TeacherSidebar } from "./TeacherSidebar";

export function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <TeacherSidebar />
      <div className="pl-64">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
