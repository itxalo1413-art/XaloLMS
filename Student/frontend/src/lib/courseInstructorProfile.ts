import { getPortalProfile } from "@/lib/portalProfile";
import {
  getInstructorProfileExtra,
  INSTRUCTOR_PROFILES_UPDATE_EVENT,
} from "@/lib/instructorProfileStore";

export type InstructorPublicProfile = {
  name: string;
  title: string;
  email: string;
  phone: string;
  ieltsBand: string;
  specialties: string[];
  experience: string;
  certifications: string[];
  bio: string;
};

const FALLBACK_EXTRA = {
  ieltsBand: "—",
  specialties: ["IELTS tổng quát"],
  experience: "—",
  certifications: [] as string[],
  bio: "Thông tin chi tiết sẽ được cập nhật bởi trung tâm.",
};

export function resolveInstructorPublicProfile(instructorName: string): InstructorPublicProfile {
  const name = instructorName.trim() || "—";
  const gv = getPortalProfile("gv");
  const extra = getInstructorProfileExtra(name) ?? FALLBACK_EXTRA;

  const useGvContact = gv.name.trim() === name;

  return {
    name: useGvContact ? gv.name : name,
    title: useGvContact ? gv.title : "Giáo viên IELTS",
    email: useGvContact ? gv.email : "—",
    phone: useGvContact ? gv.phone : "—",
    ...extra,
  };
}

export { INSTRUCTOR_PROFILES_UPDATE_EVENT };
