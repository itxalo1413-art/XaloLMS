import { GraderLayout, GraderTopbar } from "@/components/grader/GraderLayout";
import { PortalProfileSection } from "@/components/shared/PortalProfileSection";

export default function GraderProfilePage() {
  return (
    <GraderLayout>
      <GraderTopbar title="Hồ sơ Grader" subtitle="Thông tin tài khoản chấm Writing / Speaking." />
      <main className="mx-auto max-w-3xl px-6 py-6 pb-16 md:px-8">
        <PortalProfileSection
          role="aca"
          heading="Cập nhật thông tin tài khoản hiển thị trên portal Grader."
        />
      </main>
    </GraderLayout>
  );
}
