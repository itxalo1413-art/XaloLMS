import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { CourseImportantLinksEditorSection } from "@/components/shared/CourseImportantLinksEditorSection";
import { CourseMetadataEditorSection } from "@/components/shared/CourseMetadataEditorSection";
import { InstructorProfileEditorSection } from "@/components/shared/InstructorProfileEditorSection";

export default function AcaKhoaHocPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Thông tin khóa học"
        subtitle="Metadata khóa hiển thị cho học viên trên Thông tin khóa học."
      />
      <main className="mx-auto max-w-3xl space-y-10 px-6 py-6 pb-16 md:px-8">
        <CourseMetadataEditorSection portalLabel="ACA" />
        <CourseImportantLinksEditorSection portalLabel="ACA" />
        <InstructorProfileEditorSection portalLabel="ACA" />
      </main>
    </AcaLayout>
  );
}
