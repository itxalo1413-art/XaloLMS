import { redirect } from "next/navigation";

/** Trang riêng đã gỡ — cảnh báo học tập nằm trên Danh sách học viên. */
export default function AcaAcademicWarningRedirect() {
  redirect("/aca/quan-ly/hoc-vien-lop");
}
