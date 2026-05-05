import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { DashboardHome } from "@/components/aca/DashboardHome";

export default function Home() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Dashboard"
        subtitle="Tài liệu, người dùng, mức độ tiêu thụ và tín hiệu nhanh để điều chỉnh hệ thống."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8">
        <DashboardHome />
      </main>
    </AcaLayout>
  );
}
