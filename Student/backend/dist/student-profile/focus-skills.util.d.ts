import { STUDY_FOCUS_SKILL_OPTIONS } from './student-profile-study-options';
export type FocusSkill = (typeof STUDY_FOCUS_SKILL_OPTIONS)[number];
export declare function normalizeFocusSkills(raw: unknown): FocusSkill[];
export declare function parseFocusSkillsPayload(raw: string | string[] | undefined): FocusSkill[] | undefined;
