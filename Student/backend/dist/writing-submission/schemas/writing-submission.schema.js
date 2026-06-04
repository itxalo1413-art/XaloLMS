"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritingSubmissionSchema = exports.WritingSubmission = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const writing_submission_constants_1 = require("../writing-submission.constants");
let WritingSubmission = class WritingSubmission {
    studentId;
    studentName;
    examLink;
    testDateTime;
    status;
    score;
    gradedAt;
};
exports.WritingSubmission = WritingSubmission;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], WritingSubmission.prototype, "studentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WritingSubmission.prototype, "studentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WritingSubmission.prototype, "examLink", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WritingSubmission.prototype, "testDateTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: writing_submission_constants_1.WRITING_SUBMISSION_STATUSES, default: 'pending' }),
    __metadata("design:type", String)
], WritingSubmission.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WritingSubmission.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WritingSubmission.prototype, "gradedAt", void 0);
exports.WritingSubmission = WritingSubmission = __decorate([
    (0, mongoose_1.Schema)({ collection: 'writing_submissions', timestamps: true })
], WritingSubmission);
exports.WritingSubmissionSchema = mongoose_1.SchemaFactory.createForClass(WritingSubmission);
exports.WritingSubmissionSchema.index({ studentId: 1, createdAt: -1 });
exports.WritingSubmissionSchema.index({ status: 1, createdAt: -1 });
//# sourceMappingURL=writing-submission.schema.js.map