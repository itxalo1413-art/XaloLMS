"use client";

import { useParams } from "next/navigation";
import { LeadBcbEditor } from "@/components/sale/LeadBcbEditor";

export default function SaleLeadBcbPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id || "");
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
      <LeadBcbEditor leadId={id} />
    </main>
  );
}
