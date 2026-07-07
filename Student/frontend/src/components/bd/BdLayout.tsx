import type { ReactNode } from "react";
import { BdSidebar } from "./BdSidebar";

export function BdLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <BdSidebar />
      <div className="md:pl-72">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
