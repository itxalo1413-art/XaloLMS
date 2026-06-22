import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { PortalProfileSection } from "@/components/shared/PortalProfileSection";
import { TeacherStatsCard } from "@/components/teacher/TeacherStatsCard";

export default function TeacherProfilePage() {
  return (
    <TeacherLayout>
      <TeacherTopbar title="Hồ sơ giáo viên" subtitle="Thông tin tài khoản trên portal GV." />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-12 items-start">
          <div className="md:col-span-7">
            <PortalProfileSection
              role="gv"
              heading="Cập nhật thông tin hiển thị trên portal Giáo viên (demo localStorage)."
            />
          </div>
          <div className="md:col-span-5">
            <TeacherStatsCard />
          </div>
        </div>
      </main>
    </TeacherLayout>
  );
}
