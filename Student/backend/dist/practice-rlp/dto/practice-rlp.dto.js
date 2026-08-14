"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePracticeRlpSessionDto = exports.UpdatePracticeRlpSessionDto = void 0;
class UpdatePracticeRlpSessionDto {
    attendance;
    homeworkStatus;
    teacherNote;
    lessonFileUrl;
    homeworkFileUrl;
    recordingUrl;
    contents;
    date;
    deadline;
    skill;
}
exports.UpdatePracticeRlpSessionDto = UpdatePracticeRlpSessionDto;
class CreatePracticeRlpSessionDto {
    no;
    date;
    skill;
    contents;
    teacherNote;
    deadline;
    homeworkStatus;
    attendance;
    lessonFileUrl;
    homeworkFileUrl;
    recordingUrl;
}
exports.CreatePracticeRlpSessionDto = CreatePracticeRlpSessionDto;
//# sourceMappingURL=practice-rlp.dto.js.map