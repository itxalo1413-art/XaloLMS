import {
  isAllowedStudyValue,
  STUDY_FOCUS_SKILL_OPTIONS,
} from './student-profile-study-options';

export type FocusSkill = (typeof STUDY_FOCUS_SKILL_OPTIONS)[number];

export function normalizeFocusSkills(raw: unknown): FocusSkill[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (v): v is FocusSkill =>
        typeof v === 'string' && isAllowedStudyValue('focusSkills', v),
    );
  }
  if (typeof raw === 'string' && isAllowedStudyValue('focusSkills', raw)) {
    return [raw as FocusSkill];
  }
  return [];
}

export function parseFocusSkillsPayload(
  raw: string | string[] | undefined,
): FocusSkill[] | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw === 'string' || Array.isArray(raw)) {
    return normalizeFocusSkills(raw);
  }
  return undefined;
}
