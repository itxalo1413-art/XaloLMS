import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { MockTestScheduleSection } from "@/components/teacher/MockTestScheduleSection";

export default function AcaTestSpeakingPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Chấm ca Mock Test Speaking"
        subtitle="Quản lý ca thi Speaking Mock Test, duyệt ca và nhập điểm cho học viên."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <MockTestScheduleSection />
      </main>
    </AcaLayout>
  );
}
