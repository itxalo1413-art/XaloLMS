import { MockTestScheduleSection } from "@/components/teacher/MockTestScheduleSection";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";

export default function MockTestSchedulePage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Mock Test Speaking"
        subtitle="Xem ca đã duyệt và nhập điểm + link bài chấm cho học viên."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <MockTestScheduleSection />
      </main>
    </TeacherLayout>
  );
}
