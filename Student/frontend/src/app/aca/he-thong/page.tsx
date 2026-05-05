import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { SystemControlSection } from "@/components/aca/SystemControlSection";

export default function HeThongPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Hệ thống"
        subtitle="Danh mục, tag, cấu trúc nội dung và các tác vụ nhạy cảm có xác nhận."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8">
        <SystemControlSection />
      </main>
    </AcaLayout>
  );
}
