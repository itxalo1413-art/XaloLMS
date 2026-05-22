import { getCachedAuthUser } from "@/lib/auth";
import { DEMO_STUDENT } from "@/lib/mockTestRequests";

/** Id/name học viên đang đăng nhập (cho mock test demo). */
export function getStudentIdentity() {
  const user = getCachedAuthUser();
  if (user) {
    return { id: user.id, name: user.name };
  }
  return DEMO_STUDENT;
}
