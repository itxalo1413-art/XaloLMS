import { getCachedAuthUser } from "@/lib/auth";
import { DEFAULT_STUDENT_ID, getRosterStudent, resolveActiveStudentId } from "@/lib/studentRoster";

/** Id/name học viên đang đăng nhập (cho mock test, luyện đề, v.v.). */
export function getStudentIdentity() {
  const id = resolveActiveStudentId();
  const user = getCachedAuthUser();
  if (user) {
    return { id, name: user.name, email: user.email, phone: "" };
  }
  const roster = getRosterStudent(id);
  return {
    id,
    name: roster?.name ?? "Học viên",
    email: roster?.email ?? "",
    phone: roster?.phone ?? "",
  };
}

export { DEFAULT_STUDENT_ID };
