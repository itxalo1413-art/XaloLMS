export declare const STUDY_METHOD_OPTIONS: readonly ["Tập trung luyện đề", "Thực hành theo kỹ năng", "Chú trọng lý thuyết", "Tập trung từ vựng và ngữ pháp", "Khác"];
export declare const STUDY_WEEKLY_HOURS_OPTIONS: readonly ["Dưới 5 giờ/tuần", "5-10 giờ/tuần", "10-15 giờ/tuần", "15-20 giờ/tuần", "Hơn 20 giờ/tuần"];
export declare const STUDY_CLASS_ENVIRONMENT_OPTIONS: readonly ["Lớp ENERGETIC nhiều hoạt động - nhiều tương tác - sôi động", "Lớp TASK-BASED nhiều bài tập - nhiều không gian luyện tập trực tiếp"];
export declare const STUDY_IELTS_MEANING_OPTIONS: readonly ["Mới toanh | Chưa biết gì", "Nỗi sợ | Đã trải qua niềm đau ôn luyện rùi", "Người lạ từng quen | Đã ôn luyện trước đây rất lâu", "Chiến hữu | Đã thi và từng đạt aim"];
export declare const STUDY_PREVIOUS_BAND_OPTIONS: readonly ["Chưa từng thi", "4.5", "5.0", "5.5", "6.0", "6.5+"];
export declare const STUDY_FOCUS_SKILL_OPTIONS: readonly ["Listening", "Reading", "Writing", "Speaking"];
export declare const STUDY_FIELD_ALLOWLISTS: {
    readonly method: readonly ["Tập trung luyện đề", "Thực hành theo kỹ năng", "Chú trọng lý thuyết", "Tập trung từ vựng và ngữ pháp", "Khác"];
    readonly weeklyHours: readonly ["Dưới 5 giờ/tuần", "5-10 giờ/tuần", "10-15 giờ/tuần", "15-20 giờ/tuần", "Hơn 20 giờ/tuần"];
    readonly classEnvironment: readonly ["Lớp ENERGETIC nhiều hoạt động - nhiều tương tác - sôi động", "Lớp TASK-BASED nhiều bài tập - nhiều không gian luyện tập trực tiếp"];
    readonly ieltsMeaning: readonly ["Mới toanh | Chưa biết gì", "Nỗi sợ | Đã trải qua niềm đau ôn luyện rùi", "Người lạ từng quen | Đã ôn luyện trước đây rất lâu", "Chiến hữu | Đã thi và từng đạt aim"];
    readonly previousBand: readonly ["Chưa từng thi", "4.5", "5.0", "5.5", "6.0", "6.5+"];
    readonly focusSkills: readonly ["Listening", "Reading", "Writing", "Speaking"];
};
export type StudySelectionField = keyof typeof STUDY_FIELD_ALLOWLISTS;
export declare function isAllowedStudyValue(field: StudySelectionField, value: string): boolean;
