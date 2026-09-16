import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { FinalTestGradingSection } from "@/components/teacher/FinalTestGradingSection";

export default function TeacherFinalTestPage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Final Test"
        subtitle="Các ca Final Test được gán cho bạn — nhập điểm và feedback sau khi chấm."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <FinalTestGradingSection />
      </main>
    </TeacherLayout>
  );
}
