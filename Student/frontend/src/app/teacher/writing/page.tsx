import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { WritingGradingSection } from "@/components/teacher/WritingGradingSection";

export default function TeacherWritingPage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Chấm Writing"
        subtitle="Hàng đợi bài nộp từ học viên — cập nhật trạng thái, điểm và link bài chấm."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <WritingGradingSection />
      </main>
    </TeacherLayout>
  );
}
