import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { CourseMetadataEditorSection } from "@/components/shared/CourseMetadataEditorSection";

export default function AcaKhoaHocPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Thông tin khóa học"
        subtitle="Metadata khóa hiển thị cho học viên trên Thông tin khóa học."
      />
      <main className="mx-auto max-w-3xl px-6 py-6 pb-16 md:px-8">
        <CourseMetadataEditorSection portalLabel="ACA" />
      </main>
    </AcaLayout>
  );
}
