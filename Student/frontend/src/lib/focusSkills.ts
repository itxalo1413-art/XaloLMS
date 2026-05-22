import { STUDY_FOCUS_SKILL_OPTIONS } from "@/lib/studentProfileStudyOptions";

export type FocusSkill = (typeof STUDY_FOCUS_SKILL_OPTIONS)[number];

const ALLOWED = new Set<string>(STUDY_FOCUS_SKILL_OPTIONS);

export function normalizeFocusSkills(raw: unknown): FocusSkill[] {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is FocusSkill => typeof v === "string" && ALLOWED.has(v));
  }
  if (typeof raw === "string" && ALLOWED.has(raw)) {
    return [raw as FocusSkill];
  }
  return [];
}
