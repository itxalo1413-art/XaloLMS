import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { WritingGradingSection } from "@/components/teacher/WritingGradingSection";

export default function TeacherWritingPage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Chấm Writing"
        subtitle="Quản lý hạn chấm (5 ngày kể từ lúc học viên nộp), bài nộp và cập nhật điểm Writing của học viên được giao."
      />
      <main className="mx-auto w-full px-6 py-6 pb-16 md:px-8">
        <WritingGradingSection />
      </main>
    </TeacherLayout>
  );
}
