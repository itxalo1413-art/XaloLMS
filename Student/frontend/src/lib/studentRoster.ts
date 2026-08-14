import { students, type StudentSummary } from "@/components/teacher/mockData";
import { getCachedAuthUser } from "@/lib/auth";
import { DEFAULT_STUDENT_ID } from "@/lib/studentIds";

export { DEFAULT_STUDENT_ID };

export function listStudentRoster(): StudentSummary[] {
  return students;
}

export function getRosterStudent(studentId: string): StudentSummary | undefined {
  return students.find((s) => s.id === studentId);
}

/** Id học viên đang xem trên portal Student (auth → roster → mặc định). */
export function resolveActiveStudentId(): string {
  const user = getCachedAuthUser();
  if (user?.id) {
    return user.id;
  }
  return DEFAULT_STUDENT_ID;
}
