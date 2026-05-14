import type { ReactNode } from "react";
import { TeacherSidebar } from "./TeacherSidebar";

export function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="md:pl-72">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
