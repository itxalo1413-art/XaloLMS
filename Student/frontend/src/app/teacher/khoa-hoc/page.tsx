import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { CourseMetadataEditorSection } from "@/components/shared/CourseMetadataEditorSection";

export default function TeacherKhoaHocPage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Thông tin khóa học"
        subtitle="Chỉnh metadata khóa — học viên thấy trên Thông tin khóa học."
      />
      <main className="mx-auto max-w-3xl px-6 py-6 pb-16 md:px-8">
        <CourseMetadataEditorSection portalLabel="Giáo viên" />
      </main>
    </TeacherLayout>
  );
}
