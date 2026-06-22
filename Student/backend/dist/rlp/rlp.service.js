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
let RlpService = class RlpService {
    storeModel;
    constructor(storeModel) {
        this.storeModel = storeModel;
    }
    cloneDefaults() {
        return rlp_defaults_1.DEFAULT_RLP_SESSIONS.map((s) => ({ ...s }));
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
};
exports.RlpService = RlpService;
exports.RlpService = RlpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rlp_course_store_schema_1.RlpCourseStore.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RlpService);
//# sourceMappingURL=rlp.service.js.map