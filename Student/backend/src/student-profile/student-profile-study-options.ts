/** Allowed values — keep in sync with `Student/frontend/src/lib/studentProfileStudyOptions.ts`. */

export const STUDY_METHOD_OPTIONS = [
  'Tập trung luyện đề',
  'Thực hành theo kỹ năng',
  'Chú trọng lý thuyết',
  'Tập trung từ vựng và ngữ pháp',
  'Khác',
] as const;

export const STUDY_WEEKLY_HOURS_OPTIONS = [
  'Dưới 5 giờ/tuần',
  '5-10 giờ/tuần',
  '10-15 giờ/tuần',
  '15-20 giờ/tuần',
  'Hơn 20 giờ/tuần',
] as const;

export const STUDY_CLASS_ENVIRONMENT_OPTIONS = [
  'Lớp ENERGETIC nhiều hoạt động - nhiều tương tác - sôi động',
  'Lớp TASK-BASED nhiều bài tập - nhiều không gian luyện tập trực tiếp',
] as const;

export const STUDY_IELTS_MEANING_OPTIONS = [
  'Mới toanh | Chưa biết gì',
  'Nỗi sợ | Đã trải qua niềm đau ôn luyện rùi',
  'Người lạ từng quen | Đã ôn luyện trước đây rất lâu',
  'Chiến hữu | Đã thi và từng đạt aim',
] as const;

export const STUDY_PREVIOUS_BAND_OPTIONS = [
  'Chưa từng thi',
  '4.5',
  '5.0',
  '5.5',
  '6.0',
  '6.5+',
] as const;

export const STUDY_FOCUS_SKILL_OPTIONS = [
  'Listening',
  'Reading',
  'Writing',
  'Speaking',
] as const;

export const STUDY_FIELD_ALLOWLISTS = {
  method: STUDY_METHOD_OPTIONS,
  weeklyHours: STUDY_WEEKLY_HOURS_OPTIONS,
  classEnvironment: STUDY_CLASS_ENVIRONMENT_OPTIONS,
  ieltsMeaning: STUDY_IELTS_MEANING_OPTIONS,
  previousBand: STUDY_PREVIOUS_BAND_OPTIONS,
  focusSkills: STUDY_FOCUS_SKILL_OPTIONS,
} as const;

export type StudySelectionField = keyof typeof STUDY_FIELD_ALLOWLISTS;

export function isAllowedStudyValue(
  field: StudySelectionField,
  value: string,
): boolean {
  const list = STUDY_FIELD_ALLOWLISTS[field] as readonly string[];
  return list.includes(value);
}

const STUDY_DEFAULTS: Record<Exclude<StudySelectionField, 'focusSkills'>, string> =
  {
    method: STUDY_METHOD_OPTIONS[0],
    weeklyHours: STUDY_WEEKLY_HOURS_OPTIONS[2],
    classEnvironment: STUDY_CLASS_ENVIRONMENT_OPTIONS[0],
    ieltsMeaning: STUDY_IELTS_MEANING_OPTIONS[0],
    previousBand: STUDY_PREVIOUS_BAND_OPTIONS[0],
  };

/** Chuẩn hoá 1 lựa chọn; chuỗi rỗng / lạ → undefined (bỏ qua). */
export function sanitizeStudyString(
  field: Exclude<StudySelectionField, 'focusSkills'>,
  raw: unknown,
): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const v = String(raw).trim();
  if (!v) return undefined;
  if (isAllowedStudyValue(field, v)) return v;
  if (field === 'previousBand') {
    const n = Number.parseFloat(v.replace(',', '.').replace('+', ''));
    if (Number.isFinite(n)) {
      if (n >= 6.5) return '6.5+';
      const as = n.toFixed(1);
      if (isAllowedStudyValue(field, as)) return as;
    }
  }
  return undefined;
}

export function studyStringOrDefault<K extends Exclude<StudySelectionField, 'focusSkills'>>(
  field: K,
  raw: unknown,
): (typeof STUDY_FIELD_ALLOWLISTS)[K][number] {
  return (sanitizeStudyString(field, raw) ??
    STUDY_DEFAULTS[field]) as (typeof STUDY_FIELD_ALLOWLISTS)[K][number];
}
