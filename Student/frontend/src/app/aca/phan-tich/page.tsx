import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { AnalyticsSection } from "@/components/aca/AnalyticsSection";

export default function PhanTichPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Phân tích & báo cáo"
        subtitle="KPI vận hành thật: học viên, lớp, writing, speaking, luyện đề, Final."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8">
        <AnalyticsSection />
      </main>
    </AcaLayout>
  );
}
