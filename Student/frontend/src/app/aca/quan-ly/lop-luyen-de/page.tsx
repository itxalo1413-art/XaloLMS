import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { PracticeClassScheduleSection } from "@/components/aca/PracticeClassScheduleSection";

export default function PracticeClassSchedulePage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Lớp luyện đề tập trung"
        subtitle="Cập nhật ngày giờ từng buổi hàng tuần — học viên thấy ngay trên Hỗ trợ tự học."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8">
        <PracticeClassScheduleSection />
      </main>
    </AcaLayout>
  );
}
