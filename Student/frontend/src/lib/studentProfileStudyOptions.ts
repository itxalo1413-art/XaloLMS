/**
 * Study habits / learner situation option lists.
 * Keep in sync with `Student/backend/src/student-profile/student-profile-study-options.ts`.
 */

export const STUDY_METHOD_OPTIONS = [
  "Tập trung luyện đề",
  "Thực hành theo kỹ năng",
  "Chú trọng lý thuyết",
  "Tập trung từ vựng và ngữ pháp",
  "Khác",
] as const;

export const STUDY_WEEKLY_HOURS_OPTIONS = [
  "Dưới 5 giờ/tuần",
  "5-10 giờ/tuần",
  "10-15 giờ/tuần",
  "15-20 giờ/tuần",
  "Hơn 20 giờ/tuần",
] as const;

export const STUDY_CLASS_ENVIRONMENT_OPTIONS = [
  "Lớp ENERGETIC nhiều hoạt động - nhiều tương tác - sôi động",
  "Lớp TASK-BASED nhiều bài tập - nhiều không gian luyện tập trực tiếp",
] as const;

export const STUDY_IELTS_MEANING_OPTIONS = [
  "Mới toanh | Chưa biết gì",
  "Nỗi sợ | Đã trải qua niềm đau ôn luyện rùi",
  "Người lạ từng quen | Đã ôn luyện trước đây rất lâu",
  "Chiến hữu | Đã thi và từng đạt aim",
] as const;

export const STUDY_PREVIOUS_BAND_OPTIONS = [
  "Chưa từng thi",
  "4.5",
  "5.0",
  "5.5",
  "6.0",
  "6.5+",
] as const;

export const STUDY_FOCUS_SKILL_OPTIONS = [
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
] as const;

export const studyHabitOptionLists = {
  method: [...STUDY_METHOD_OPTIONS],
  weeklyHours: [...STUDY_WEEKLY_HOURS_OPTIONS],
  classEnvironment: [...STUDY_CLASS_ENVIRONMENT_OPTIONS],
  ieltsMeaning: [...STUDY_IELTS_MEANING_OPTIONS],
  previousBand: [...STUDY_PREVIOUS_BAND_OPTIONS],
  focusSkills: [...STUDY_FOCUS_SKILL_OPTIONS],
};

/** Initial select values — aligned with backend `DEFAULT_STUDENT_PROFILE` study fields. */
export const defaultStudyHabitForm = {
  method: STUDY_METHOD_OPTIONS[0],
  weeklyHours: STUDY_WEEKLY_HOURS_OPTIONS[2],
  classEnvironment: STUDY_CLASS_ENVIRONMENT_OPTIONS[0],
  ieltsMeaning: STUDY_IELTS_MEANING_OPTIONS[0],
  previousBand: STUDY_PREVIOUS_BAND_OPTIONS[0],
  focusSkills: STUDY_FOCUS_SKILL_OPTIONS[0],
};
