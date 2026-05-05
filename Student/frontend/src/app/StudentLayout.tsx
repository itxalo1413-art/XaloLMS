import * as React from "react";
import { Sidebar } from "@/components/student/Sidebar";
import { Topbar } from "@/components/student/Topbar";

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pl-64">
          <Topbar />
          <main className="flex-1 px-4 pt-[18px] pb-8 md:px-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

