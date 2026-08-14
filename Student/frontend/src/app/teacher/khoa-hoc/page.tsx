import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { CourseMetadataEditorSection } from "@/components/shared/CourseMetadataEditorSection";
import { CourseImportantLinksEditorSection } from "@/components/shared/CourseImportantLinksEditorSection";

export default function TeacherKhoaHocPage() {
  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Thông tin khóa học"
        subtitle="Chỉnh metadata khóa & link thư mục bài giảng, bài tập, khảo sát."
      />
      <main className="mx-auto max-w-3xl space-y-10 px-6 py-6 pb-16 md:px-8">
        <CourseMetadataEditorSection portalLabel="Giáo viên" />
        <CourseImportantLinksEditorSection portalLabel="Giáo viên" />
      </main>
    </TeacherLayout>
  );
}
