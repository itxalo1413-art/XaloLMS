import type { ReactNode } from "react";
import { AcaSidebar } from "./AcaSidebar";

export function AcaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <AcaSidebar />
      <div className="pl-64">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
