import { STUDY_CLASS_ENVIRONMENT_OPTIONS, STUDY_FOCUS_SKILL_OPTIONS, STUDY_IELTS_MEANING_OPTIONS, STUDY_METHOD_OPTIONS, STUDY_PREVIOUS_BAND_OPTIONS, STUDY_WEEKLY_HOURS_OPTIONS } from './student-profile-study-options';
export type StudentProfile = {
    name: string;
    email: string;
    phone: string;
    dob: string;
    zodiac: string;
    avatarUrl: string;
    method: (typeof STUDY_METHOD_OPTIONS)[number];
    weeklyHours: (typeof STUDY_WEEKLY_HOURS_OPTIONS)[number];
    classEnvironment: (typeof STUDY_CLASS_ENVIRONMENT_OPTIONS)[number];
    ieltsMeaning: (typeof STUDY_IELTS_MEANING_OPTIONS)[number];
    previousBand: (typeof STUDY_PREVIOUS_BAND_OPTIONS)[number];
    focusSkills: (typeof STUDY_FOCUS_SKILL_OPTIONS)[number][];
};
export declare const DEFAULT_STUDENT_PROFILE: StudentProfile;
