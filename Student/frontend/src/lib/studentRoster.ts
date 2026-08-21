import { getCachedAuthUser } from "@/lib/auth";
import { DEFAULT_STUDENT_ID } from "@/lib/studentIds";

export { DEFAULT_STUDENT_ID };

export type StudentSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group?: string;
  status?: string;
  overallBand?: string;
  learningSummary?: string;
};

export function listStudentRoster(): StudentSummary[] {
  return [];
}

export function getRosterStudent(_studentId: string): StudentSummary | undefined {
  return undefined;
}

/** Id học viên đang xem trên portal Student (auth → mặc định). */
export function resolveActiveStudentId(): string {
  const user = getCachedAuthUser();
  if (user?.id) {
    return user.id;
  }
  return DEFAULT_STUDENT_ID;
}
