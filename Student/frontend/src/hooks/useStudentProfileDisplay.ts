"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_STUDENT_PROFILE,
  getStudentProfile,
  getStudyHabitsLocalWriteAt,
  pickStudyHabits,
  saveStudentProfile,
  STUDENT_PROFILE_UPDATE_EVENT,
  type StudentProfile,
} from "@/lib/studentProfile";
import { resolveActiveStudentId } from "@/lib/studentRoster";
import { fetchStudentProfile } from "@/lib/studentProfileApi";
import { fetchLiveStudentDiagnosis } from "@/lib/studentDiagnosisApi";
import { getAuthToken } from "@/lib/auth";

function applyContact(
  base: StudentProfile,
  live?: {
    name?: string;
    email?: string;
    phone?: string;
    aim?: string;
    examDate?: string;
    scores?: StudentProfile["scores"];
  } | null,
  remote?: StudentProfile | null,
): StudentProfile {
  const scores = (() => {
    const pick = (
      a?: { listening?: number; reading?: number; writing?: number; speaking?: number; overall?: number },
      b?: StudentProfile["scores"],
    ) => {
      const listening = (a?.listening || 0) > 0 ? a!.listening! : b?.listening || 0;
      const reading = (a?.reading || 0) > 0 ? a!.reading! : b?.reading || 0;
      const writing = (a?.writing || 0) > 0 ? a!.writing! : b?.writing || 0;
      const speaking = (a?.speaking || 0) > 0 ? a!.speaking! : b?.speaking || 0;
      const overall = (a?.overall || 0) > 0 ? a!.overall! : b?.overall || 0;
      return { listening, reading, writing, speaking, overall };
    };
    return pick(live?.scores, pick(remote?.scores, base.scores));
  })();
  return {
    ...base,
    ...(remote || {}),
    name: live?.name?.trim() || remote?.name || base.name,
    email: live?.email?.trim() || remote?.email || base.email,
    phone: live?.phone?.trim() || remote?.phone || base.phone,
    aim: live?.aim?.trim() || remote?.aim || base.aim || "",
    examDate: live?.examDate?.trim() || remote?.examDate || base.examDate || "",
    scores,
  };
}

/** Hồ sơ học viên: contact lấy từ Sale/ACA (diagnosis), không dùng SĐT mock local. */
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

  useEffect(() => {
    if (!getAuthToken()) return;
    let alive = true;
    const startedAt = Date.now();
    void Promise.all([
      fetchStudentProfile().catch(() => null),
      fetchLiveStudentDiagnosis().catch(() => null),
    ]).then(([remote, live]) => {
      if (!alive) return;
      const current = getStudentProfile(activeId);
      const merged = applyContact(
        {
          ...DEFAULT_STUDENT_PROFILE,
          ...current,
        },
        live
          ? {
              name: live.name,
              email: live.email,
              phone: live.phone,
              aim: live.aim,
              examDate: live.examDate,
              scores: live.scores,
            }
          : null,
        remote,
      );
      if (getStudyHabitsLocalWriteAt() > startedAt) {
        Object.assign(merged, pickStudyHabits(current));
      }
      saveStudentProfile(merged, activeId);
    });
    return () => {
      alive = false;
    };
  }, [activeId]);

  return profile;
}
