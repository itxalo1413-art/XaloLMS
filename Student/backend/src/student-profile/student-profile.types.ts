import {
  STUDY_CLASS_ENVIRONMENT_OPTIONS,
  STUDY_FOCUS_SKILL_OPTIONS,
  STUDY_IELTS_MEANING_OPTIONS,
  STUDY_METHOD_OPTIONS,
  STUDY_PREVIOUS_BAND_OPTIONS,
  STUDY_WEEKLY_HOURS_OPTIONS,
} from './student-profile-study-options';

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
  focusSkills: (typeof STUDY_FOCUS_SKILL_OPTIONS)[number];
};

export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  name: 'Dương Nguyên',
  email: 'nguyenduong939705@gmail.com',
  phone: '0947 188 794',
  dob: '20/08/2006',
  zodiac: 'Sư Tử',
  avatarUrl: '',
  method: STUDY_METHOD_OPTIONS[0],
  weeklyHours: STUDY_WEEKLY_HOURS_OPTIONS[2],
  classEnvironment: STUDY_CLASS_ENVIRONMENT_OPTIONS[0],
  ieltsMeaning: STUDY_IELTS_MEANING_OPTIONS[0],
  previousBand: STUDY_PREVIOUS_BAND_OPTIONS[0],
  focusSkills: STUDY_FOCUS_SKILL_OPTIONS[0],
};
