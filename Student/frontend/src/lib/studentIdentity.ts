import { getCachedAuthUser } from "@/lib/auth";
import { DEFAULT_STUDENT_ID, getRosterStudent, resolveActiveStudentId } from "@/lib/studentRoster";

/** Id/name học viên đang đăng nhập (cho mock test, luyện đề, v.v.). */
export function getStudentIdentity() {
  const id = resolveActiveStudentId();
  const user = getCachedAuthUser();
  if (user) {
    return { id, name: user.name };
  }
  const roster = getRosterStudent(id);
  return {
    id,
    name: roster?.name ?? "Học viên",
  };
}

export { DEFAULT_STUDENT_ID };
