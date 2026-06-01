import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { PortalProfileSection } from "@/components/shared/PortalProfileSection";

export default function TeacherProfilePage() {
  return (
    <TeacherLayout>
      <TeacherTopbar title="Hồ sơ giáo viên" subtitle="Thông tin tài khoản trên portal GV." />
      <main className="mx-auto max-w-3xl px-6 py-6 pb-16 md:px-8">
        <PortalProfileSection
          role="gv"
          heading="Cập nhật thông tin hiển thị trên portal Giáo viên (demo localStorage)."
        />
      </main>
    </TeacherLayout>
  );
}
