"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeFocusSkills = normalizeFocusSkills;
exports.parseFocusSkillsPayload = parseFocusSkillsPayload;
const student_profile_study_options_1 = require("./student-profile-study-options");
function normalizeFocusSkills(raw) {
    if (Array.isArray(raw)) {
        return raw.filter((v) => typeof v === 'string' && (0, student_profile_study_options_1.isAllowedStudyValue)('focusSkills', v));
    }
    if (typeof raw === 'string' && (0, student_profile_study_options_1.isAllowedStudyValue)('focusSkills', raw)) {
        return [raw];
    }
    return [];
}
function parseFocusSkillsPayload(raw) {
    if (raw === undefined)
        return undefined;
    if (typeof raw === 'string' || Array.isArray(raw)) {
        return normalizeFocusSkills(raw);
    }
    return undefined;
}
//# sourceMappingURL=focus-skills.util.js.map