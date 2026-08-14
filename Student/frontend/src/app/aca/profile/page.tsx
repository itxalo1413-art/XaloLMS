import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { PortalProfileSection } from "@/components/shared/PortalProfileSection";

export default function AcaProfilePage() {
  return (
    <AcaLayout>
      <AcaTopbar title="Hồ sơ ACA" subtitle="Thông tin tài khoản điều phối học thuật." />
      <main className="mx-auto max-w-3xl px-6 py-6 pb-16 md:px-8">
        <PortalProfileSection
          role="aca"
          heading="Cập nhật thông tin tài khoản hiển thị trên portal ACA."
        />
      </main>
    </AcaLayout>
  );
}
