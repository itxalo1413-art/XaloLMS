import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { ContentGovernanceSection } from "@/components/aca/ContentGovernanceSection";

export default function QuanLyNoiDungPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Quản lý nội dung"
        subtitle="Trạng thái duyệt, metadata và ẩn/hiển thị — thao tác nhanh, ít nhấp nhất có thể."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8">
        <ContentGovernanceSection />
      </main>
    </AcaLayout>
  );
}
