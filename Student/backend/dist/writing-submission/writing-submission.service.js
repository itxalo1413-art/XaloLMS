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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritingSubmissionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_service_1 = require("../users/users.service");
const writing_submission_constants_1 = require("./writing-submission.constants");
const writing_submission_schema_1 = require("./schemas/writing-submission.schema");
let WritingSubmissionService = class WritingSubmissionService {
    model;
    users;
    constructor(model, users) {
        this.model = model;
        this.users = users;
    }
    toPublic(doc) {
        const status = (0, writing_submission_constants_1.isWritingSubmissionStatus)(doc.status)
            ? doc.status
            : 'pending';
        return {
            id: doc._id.toString(),
            studentId: doc.studentId,
            studentName: doc.studentName,
            examLink: doc.examLink,
            testDateTime: doc.testDateTime,
            submittedAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
            status,
            score: doc.score,
            gradedAt: doc.gradedAt,
            dueDate: doc.dueDate,
            studentGmail: doc.studentGmail,
            type: doc.type,
            task1: doc.task1,
            task2: doc.task2,
            note: doc.note,
        };
    }
    async findByIdOrThrow(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Không tìm thấy bài nộp');
        }
        const doc = await this.model.findById(id).lean().exec();
        if (!doc)
            throw new common_1.NotFoundException('Không tìm thấy bài nộp');
        return doc;
    }
    async resolveStudentName(studentId, fallback) {
        if (fallback?.trim())
            return fallback.trim();
        if (mongoose_2.Types.ObjectId.isValid(studentId)) {
            try {
                const user = await this.users.getPublicById(studentId);
                return user.name;
            }
            catch {
            }
        }
        return 'Học viên';
    }
    async listForStudent(studentId) {
        const rows = await this.model
            .find({ studentId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows.map((r) => this.toPublic(r));
    }
    async listForTeacher(status) {
        const filter = {};
        if (status && status !== 'all' && (0, writing_submission_constants_1.isWritingSubmissionStatus)(status)) {
            filter.status = status;
        }
        const rows = await this.model
            .find(filter)
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows.map((r) => this.toPublic(r));
    }
    async createForStudent(studentId, studentName, payload) {
        const examLink = payload.examLink?.trim();
        if (!examLink) {
            throw new common_1.BadRequestException('Thiếu link bài làm');
        }
        const now = new Date();
        const testDateTime = payload.testDateTime?.trim() || now.toISOString();
        const name = await this.resolveStudentName(studentId, studentName);
        const created = await this.model.create({
            studentId,
            studentName: name,
            examLink,
            testDateTime,
            status: 'pending',
            dueDate: payload.dueDate?.trim() || '',
            studentGmail: payload.studentGmail?.trim() || '',
            type: payload.type?.trim() || '',
            task1: payload.task1?.trim() || '',
            task2: payload.task2?.trim() || '',
            note: payload.note?.trim() || '',
        });
        return this.toPublic(created.toObject());
    }
    async grade(id, payload) {
        const doc = await this.findByIdOrThrow(id);
        const nextStatus = payload.status ?? doc.status;
        if (!(0, writing_submission_constants_1.isWritingSubmissionStatus)(nextStatus)) {
            throw new common_1.BadRequestException('Trạng thái không hợp lệ');
        }
        const score = payload.score?.trim() !== undefined ? payload.score.trim() : doc.score;
        const examLink = payload.examLink?.trim() !== undefined ? payload.examLink.trim() : doc.examLink;
        const dueDate = payload.dueDate?.trim() !== undefined ? payload.dueDate.trim() : doc.dueDate;
        const studentGmail = payload.studentGmail?.trim() !== undefined ? payload.studentGmail.trim() : doc.studentGmail;
        const type = payload.type?.trim() !== undefined ? payload.type.trim() : doc.type;
        const task1 = payload.task1?.trim() !== undefined ? payload.task1.trim() : doc.task1;
        const task2 = payload.task2?.trim() !== undefined ? payload.task2.trim() : doc.task2;
        const note = payload.note?.trim() !== undefined ? payload.note.trim() : doc.note;
        if (nextStatus === 'graded' && !score) {
            throw new common_1.BadRequestException('Cần nhập điểm khi chấm xong');
        }
        const gradedAt = nextStatus === 'graded'
            ? new Date().toISOString()
            : nextStatus === 'pending'
                ? undefined
                : doc.gradedAt;
        const updated = await this.model
            .findByIdAndUpdate(doc._id, {
            $set: {
                status: nextStatus,
                score: score || undefined,
                examLink,
                gradedAt,
                dueDate,
                studentGmail,
                type,
                task1,
                task2,
                note,
            },
        }, { new: true })
            .lean()
            .exec();
        return this.toPublic(updated);
    }
};
exports.WritingSubmissionService = WritingSubmissionService;
exports.WritingSubmissionService = WritingSubmissionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(writing_submission_schema_1.WritingSubmission.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService])
], WritingSubmissionService);
//# sourceMappingURL=writing-submission.service.js.map