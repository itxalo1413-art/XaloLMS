import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { StudentListSection } from "@/components/teacher/StudentListSection";

export default function Home() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Danh sách học sinh"
        subtitle="Tìm kiếm, lọc và mở nhanh hồ sơ để nhận xét hoặc cập nhật."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <StudentListSection />
      </main>
    </TeacherLayout>
  );
}
