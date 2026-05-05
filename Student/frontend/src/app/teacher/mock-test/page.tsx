import { MockTestScheduleSection } from "@/components/teacher/MockTestScheduleSection";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { LOGGED_IN_TEACHER_NAME } from "@/components/teacher/mockTestTeachers";

export default function MockTestSchedulePage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Lịch Mock Test"
        subtitle={`${LOGGED_IN_TEACHER_NAME} · Các ca được xếp cho bạn sau khi ACA duyệt đăng ký của học viên.`}
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <MockTestScheduleSection />
      </main>
    </TeacherLayout>
  );
}
