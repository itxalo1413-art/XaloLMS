"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STUDY_FIELD_ALLOWLISTS = exports.STUDY_FOCUS_SKILL_OPTIONS = exports.STUDY_PREVIOUS_BAND_OPTIONS = exports.STUDY_IELTS_MEANING_OPTIONS = exports.STUDY_CLASS_ENVIRONMENT_OPTIONS = exports.STUDY_WEEKLY_HOURS_OPTIONS = exports.STUDY_METHOD_OPTIONS = void 0;
exports.isAllowedStudyValue = isAllowedStudyValue;
exports.STUDY_METHOD_OPTIONS = [
    'Tập trung luyện đề',
    'Thực hành theo kỹ năng',
    'Chú trọng lý thuyết',
    'Tập trung từ vựng và ngữ pháp',
    'Khác',
];
exports.STUDY_WEEKLY_HOURS_OPTIONS = [
    'Dưới 5 giờ/tuần',
    '5-10 giờ/tuần',
    '10-15 giờ/tuần',
    '15-20 giờ/tuần',
    'Hơn 20 giờ/tuần',
];
exports.STUDY_CLASS_ENVIRONMENT_OPTIONS = [
    'Lớp ENERGETIC nhiều hoạt động - nhiều tương tác - sôi động',
    'Lớp TASK-BASED nhiều bài tập - nhiều không gian luyện tập trực tiếp',
];
exports.STUDY_IELTS_MEANING_OPTIONS = [
    'Mới toanh | Chưa biết gì',
    'Nỗi sợ | Đã trải qua niềm đau ôn luyện rùi',
    'Người lạ từng quen | Đã ôn luyện trước đây rất lâu',
    'Chiến hữu | Đã thi và từng đạt aim',
];
exports.STUDY_PREVIOUS_BAND_OPTIONS = [
    'Chưa từng thi',
    '4.5',
    '5.0',
    '5.5',
    '6.0',
    '6.5+',
];
exports.STUDY_FOCUS_SKILL_OPTIONS = [
    'Listening',
    'Reading',
    'Writing',
    'Speaking',
];
exports.STUDY_FIELD_ALLOWLISTS = {
    method: exports.STUDY_METHOD_OPTIONS,
    weeklyHours: exports.STUDY_WEEKLY_HOURS_OPTIONS,
    classEnvironment: exports.STUDY_CLASS_ENVIRONMENT_OPTIONS,
    ieltsMeaning: exports.STUDY_IELTS_MEANING_OPTIONS,
    previousBand: exports.STUDY_PREVIOUS_BAND_OPTIONS,
    focusSkills: exports.STUDY_FOCUS_SKILL_OPTIONS,
};
function isAllowedStudyValue(field, value) {
    const list = exports.STUDY_FIELD_ALLOWLISTS[field];
    return list.includes(value);
}
//# sourceMappingURL=student-profile-study-options.js.map