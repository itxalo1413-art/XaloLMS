"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WRITING_SUBMISSION_STATUSES = void 0;
exports.isWritingSubmissionStatus = isWritingSubmissionStatus;
exports.WRITING_SUBMISSION_STATUSES = [
    'pending',
    'grading',
    'graded',
];
function isWritingSubmissionStatus(value) {
    return exports.WRITING_SUBMISSION_STATUSES.includes(value);
}
//# sourceMappingURL=writing-submission.constants.js.map