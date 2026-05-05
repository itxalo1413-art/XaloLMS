import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import { UserManagementSection } from "@/components/aca/UserManagementSection";

export default function QuanLyNguoiDungPage() {
  return (
    <AcaLayout>
      <AcaTopbar
        title="Người dùng"
        subtitle="Danh sách tài khoản, vai trò HS / GV / ACA và khóa khi cần."
      />
      <main className="mx-auto max-w-7xl px-6 py-6 pb-16 md:px-8">
        <UserManagementSection />
      </main>
    </AcaLayout>
  );
}
