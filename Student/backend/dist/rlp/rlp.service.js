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
exports.RlpService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const rlp_defaults_1 = require("./rlp-defaults");
const rlp_course_store_schema_1 = require("./schemas/rlp-course-store.schema");
const aca_student_schema_1 = require("../aca/schemas/aca-student.schema");
const aca_class_schema_1 = require("../aca/schemas/aca-class.schema");
let RlpService = class RlpService {
    storeModel;
    studentModel;
    classModel;
    constructor(storeModel, studentModel, classModel) {
        this.storeModel = storeModel;
        this.studentModel = studentModel;
        this.classModel = classModel;
    }
    cloneDefaults() {
        return rlp_defaults_1.DEFAULT_RLP_SESSIONS.map((s) => ({ ...s }));
    }
    async ensureStoreForClass(classId) {
        if (!classId) {
            return this.ensureStore();
        }
        const storeKey = `rlp_store_${classId}`;
        let doc = await this.storeModel.findOne({ key: storeKey }).lean().exec();
        if (!doc?.sessions?.length) {
            const cls = await this.classModel.findById(classId).lean().exec();
            const baseSessions = this.cloneDefaults();
            if (cls && (cls.phaseStartDate || cls.openDate)) {
                const dateStr = cls.phaseStartDate || cls.openDate;
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const d = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    const y = parseInt(parts[2], 10);
                    const startDate = new Date(y, m - 1, d);
                    baseSessions.forEach((session, idx) => {
                        const currentSessionDate = new Date(startDate);
                        currentSessionDate.setDate(startDate.getDate() + Math.round(idx * 3.5));
                        const dd = String(currentSessionDate.getDate()).padStart(2, '0');
                        const mm = String(currentSessionDate.getMonth() + 1).padStart(2, '0');
                        const yyyy = currentSessionDate.getFullYear();
                        session.date = `${dd}/${mm}/${yyyy}`;
                        const deadlineDate = new Date(currentSessionDate);
                        deadlineDate.setDate(currentSessionDate.getDate() + 7);
                        const ddd = String(deadlineDate.getDate()).padStart(2, '0');
                        const mmm = String(deadlineDate.getMonth() + 1).padStart(2, '0');
                        const yyyyy = deadlineDate.getFullYear();
                        session.deadline = `${ddd}/${mmm}/${yyyyy}`;
                        session.teacherNote = '—';
                        session.homeworkStatus = 'not_assigned';
                        session.attendance = 'present';
                    });
                }
            }
            const created = await this.storeModel.create({
                key: storeKey,
                sessions: baseSessions,
            });
            doc = created.toObject();
        }
        return doc.sessions;
    }
    async ensureStore() {
        let doc = await this.storeModel.findOne({ key: rlp_course_store_schema_1.RLP_COURSE_KEY }).lean().exec();
        if (!doc?.sessions?.length) {
            const created = await this.storeModel.create({
                key: rlp_course_store_schema_1.RLP_COURSE_KEY,
                sessions: this.cloneDefaults(),
            });
            doc = created.toObject();
        }
        return doc.sessions;
    }
    normalizeSessions(sessions) {
        return sessions.map((s) => ({
            ...s,
            lessonFileUrl: s.lessonFileUrl?.trim() ?? '',
        }));
    }
    async listSessions() {
        return this.normalizeSessions(await this.ensureStore());
    }
    async listSessionsForStudent(email) {
        if (!email)
            return this.listSessions();
        const student = await this.studentModel.findOne({ email }).lean().exec();
        if (!student || !student.classId) {
            return this.listSessions();
        }
        return this.normalizeSessions(await this.ensureStoreForClass(student.classId));
    }
    async listSessionsForClass(classId) {
        if (!classId)
            return this.listSessions();
        return this.normalizeSessions(await this.ensureStoreForClass(classId));
    }
    async updateSession(no, payload) {
        const sessions = await this.ensureStore();
        const index = sessions.findIndex((s) => s.no === no);
        if (index < 0) {
            throw new common_1.NotFoundException('Không tìm thấy buổi RLP');
        }
        const current = sessions[index];
        const next = {
            ...current,
            ...(payload.attendance !== undefined
                ? { attendance: payload.attendance }
                : {}),
            ...(payload.homeworkStatus !== undefined
                ? { homeworkStatus: payload.homeworkStatus }
                : {}),
            ...(payload.teacherNote !== undefined
                ? { teacherNote: payload.teacherNote.trim() }
                : {}),
            ...(payload.lessonFileUrl !== undefined
                ? { lessonFileUrl: payload.lessonFileUrl.trim() }
                : {}),
        };
        sessions[index] = next;
        await this.storeModel
            .findOneAndUpdate({ key: rlp_course_store_schema_1.RLP_COURSE_KEY }, { $set: { sessions } }, { upsert: true })
            .exec();
        return next;
    }
    async updateSessionForClass(classId, no, payload) {
        if (!classId) {
            return this.updateSession(no, payload);
        }
        const storeKey = `rlp_store_${classId}`;
        const sessions = await this.ensureStoreForClass(classId);
        const index = sessions.findIndex((s) => s.no === no);
        if (index < 0) {
            throw new common_1.NotFoundException('Không tìm thấy buổi RLP');
        }
        const current = sessions[index];
        const next = {
            ...current,
            ...(payload.attendance !== undefined
                ? { attendance: payload.attendance }
                : {}),
            ...(payload.homeworkStatus !== undefined
                ? { homeworkStatus: payload.homeworkStatus }
                : {}),
            ...(payload.teacherNote !== undefined
                ? { teacherNote: payload.teacherNote.trim() }
                : {}),
            ...(payload.lessonFileUrl !== undefined
                ? { lessonFileUrl: payload.lessonFileUrl.trim() }
                : {}),
        };
        sessions[index] = next;
        await this.storeModel
            .findOneAndUpdate({ key: storeKey }, { $set: { sessions } }, { upsert: true })
            .exec();
        return next;
    }
};
exports.RlpService = RlpService;
exports.RlpService = RlpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rlp_course_store_schema_1.RlpCourseStore.name)),
    __param(1, (0, mongoose_1.InjectModel)(aca_student_schema_1.AcaStudent.name)),
    __param(2, (0, mongoose_1.InjectModel)(aca_class_schema_1.AcaClass.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], RlpService);
//# sourceMappingURL=rlp.service.js.map