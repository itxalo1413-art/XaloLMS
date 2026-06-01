import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { RlpEditorSection } from "@/components/teacher/RlpEditorSection";

export default function TeacherRlpPage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Cập nhật RLP"
        subtitle="Điểm danh, homework và ghi chú GV — đồng bộ với bảng RLP học viên."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <RlpEditorSection />
      </main>
    </TeacherLayout>
  );
}
