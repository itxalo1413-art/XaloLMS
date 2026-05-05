import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { MockTestApprovalSection } from "@/components/aca/MockTestApprovalSection";

export default function MockTestApprovalPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Duyệt Mock Test"
        subtitle="Gán giờ thi và giáo viên test; chỉ sau khi duyệt, học viên mới thấy trên lịch (demo localStorage)."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8">
        <MockTestApprovalSection />
      </main>
    </AcaLayout>
  );
}
