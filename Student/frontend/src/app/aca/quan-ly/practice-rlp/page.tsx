"use client";

import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { PracticeRlpEditorSection } from "@/components/shared/PracticeRlpEditorSection";

export default function AcaPracticeRlpPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="RLP lớp luyện đề"
        subtitle="Học vụ chỉnh RLP luyện đề theo HV — đồng bộ với portal Minh Tâm và học viên."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <PracticeRlpEditorSection />
      </main>
    </AcaLayout>
  );
}
