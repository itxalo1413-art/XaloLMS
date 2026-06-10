"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_STUDENT_PROFILE,
  getStudentProfile,
  STUDENT_PROFILE_UPDATE_EVENT,
  type StudentProfile,
} from "@/lib/studentProfile";
import { resolveActiveStudentId } from "@/lib/studentRoster";

/** Read-only profile for student-facing pages (no auth context required). */
export function useStudentProfileDisplay(studentId?: string) {
  const activeId = studentId ?? resolveActiveStudentId();
  const [profile, setProfile] = useState<StudentProfile>(() =>
    getStudentProfile(activeId),
  );

  const sync = useCallback(() => {
    setProfile(getStudentProfile(activeId));
  }, [activeId]);

  useEffect(() => {
    sync();
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ studentId?: string }>).detail;
      if (!detail?.studentId || detail.studentId === activeId) sync();
    };
    window.addEventListener(STUDENT_PROFILE_UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_PROFILE_UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", sync);
    };
  }, [sync, activeId]);

  return profile;
}
