"use client";

import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { WritingGradingSection } from "@/components/teacher/WritingGradingSection";

export default function AcaWritingPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Chấm Writing"
        subtitle="Quản lý thời hạn, thông tin bài làm và cập nhật điểm chấm Writing của học viên."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8">
        <WritingGradingSection />
      </main>
    </AcaLayout>
  );
}
