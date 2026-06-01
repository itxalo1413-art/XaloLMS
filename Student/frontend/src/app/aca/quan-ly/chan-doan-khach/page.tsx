import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { GuestDiagnosisLeadsSection } from "@/components/aca/GuestDiagnosisLeadsSection";

export default function ChanDoanKhachPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Lead chẩn đoán khách"
        subtitle="Đăng ký tư vấn từ trang Guest Diagnostic — cập nhật trạng thái và ghi chú."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8">
        <GuestDiagnosisLeadsSection />
      </main>
    </AcaLayout>
  );
}
