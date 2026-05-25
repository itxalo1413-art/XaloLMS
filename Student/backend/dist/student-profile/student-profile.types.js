"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_STUDENT_PROFILE = void 0;
const student_profile_study_options_1 = require("./student-profile-study-options");
exports.DEFAULT_STUDENT_PROFILE = {
    name: 'Dương Nguyên',
    email: 'nguyenduong939705@gmail.com',
    phone: '0947 188 794',
    dob: '20/08/2006',
    zodiac: 'Sư Tử',
    avatarUrl: '',
    method: student_profile_study_options_1.STUDY_METHOD_OPTIONS[0],
    weeklyHours: student_profile_study_options_1.STUDY_WEEKLY_HOURS_OPTIONS[2],
    classEnvironment: student_profile_study_options_1.STUDY_CLASS_ENVIRONMENT_OPTIONS[0],
    ieltsMeaning: student_profile_study_options_1.STUDY_IELTS_MEANING_OPTIONS[0],
    previousBand: student_profile_study_options_1.STUDY_PREVIOUS_BAND_OPTIONS[0],
    focusSkills: [student_profile_study_options_1.STUDY_FOCUS_SKILL_OPTIONS[0]],
};
//# sourceMappingURL=student-profile.types.js.map