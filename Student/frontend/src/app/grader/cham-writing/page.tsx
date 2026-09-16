"use client";

import { GraderLayout, GraderTopbar } from "@/components/grader/GraderLayout";
import { WritingGradingSection } from "@/components/teacher/WritingGradingSection";

export default function GraderWritingPage() {
  return (
    <GraderLayout>
      <GraderTopbar
        title="Chấm Writing"
        subtitle="Chấm bài Writing và nhập tiêu chí BCB (Entrance / Final). Support chỉ cần band tổng."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8">
        <WritingGradingSection />
      </main>
    </GraderLayout>
  );
}
