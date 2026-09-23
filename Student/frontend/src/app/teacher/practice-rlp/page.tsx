"use client";

import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { PracticeRlpEditorSection } from "@/components/shared/PracticeRlpEditorSection";

export default function TeacherPracticeRlpPage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="RLP lớp luyện đề"
        subtitle="Minh Tâm cập nhật RLP luyện đề theo từng học viên — đồng bộ với trang Hỗ trợ tự học."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <PracticeRlpEditorSection />
      </main>
    </TeacherLayout>
  );
}
