import type { ReactNode } from "react";
import { AcaSidebar } from "./AcaSidebar";

export function AcaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AcaSidebar />
      <div className="md:pl-72">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
