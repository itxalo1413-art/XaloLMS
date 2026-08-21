import { redirect } from "next/navigation";

/** Trang riêng đã gỡ — cảnh báo học tập nằm trên danh sách học viên lớp. */
export default function TeacherAcademicWarningRedirect() {
  redirect("/teacher");
}
