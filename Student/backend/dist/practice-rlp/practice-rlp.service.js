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
exports.PracticeRlpService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const practice_rlp_store_schema_1 = require("./schemas/practice-rlp-store.schema");
let PracticeRlpService = class PracticeRlpService {
    storeModel;
    constructor(storeModel) {
        this.storeModel = storeModel;
    }
    async ensureStore(studentId) {
        let doc = await this.storeModel.findOne({ studentId }).lean().exec();
        if (!doc) {
            await this.storeModel.create({ studentId, sessions: [] });
            return [];
        }
        return doc.sessions ?? [];
    }
    async listSessions(studentId) {
        return this.ensureStore(studentId);
    }
    async addSession(studentId, dto) {
        const sessions = await this.ensureStore(studentId);
        const existingNos = new Set(sessions.map((s) => s.no));
        const no = dto.no ?? (sessions.length > 0 ? Math.max(...sessions.map((s) => s.no)) + 1 : 1);
        if (existingNos.has(no)) {
            throw new Error(`Buổi số ${no} đã tồn tại`);
        }
        const newSession = {
            no,
            date: dto.date ?? '',
            skill: dto.skill ?? 'Speaking',
            contents: dto.contents ?? '',
            teacherNote: dto.teacherNote?.trim() ?? '—',
            deadline: dto.deadline ?? '',
            homeworkStatus: dto.homeworkStatus ?? 'not_assigned',
            attendance: dto.attendance ?? 'present',
            lessonFileUrl: dto.lessonFileUrl?.trim() ?? '',
            homeworkFileUrl: dto.homeworkFileUrl?.trim() ?? '',
            recordingUrl: dto.recordingUrl?.trim() ?? '',
        };
        const updated = [...sessions, newSession].sort((a, b) => a.no - b.no);
        await this.storeModel.collection.updateOne({ studentId }, { $set: { sessions: updated } });
        return newSession;
    }
    async updateSession(studentId, no, dto) {
        const sessions = await this.ensureStore(studentId);
        const idx = sessions.findIndex((s) => s.no === no);
        if (idx < 0)
            throw new common_1.NotFoundException(`Không tìm thấy buổi RLP số ${no}`);
        const patch = {};
        if (dto.attendance !== undefined)
            patch.attendance = dto.attendance;
        if (dto.homeworkStatus !== undefined)
            patch.homeworkStatus = dto.homeworkStatus;
        if (dto.teacherNote !== undefined)
            patch.teacherNote = dto.teacherNote.trim();
        if (dto.lessonFileUrl !== undefined)
            patch.lessonFileUrl = dto.lessonFileUrl.trim();
        if (dto.homeworkFileUrl !== undefined)
            patch.homeworkFileUrl = dto.homeworkFileUrl.trim();
        if (dto.recordingUrl !== undefined)
            patch.recordingUrl = dto.recordingUrl.trim();
        if (dto.contents !== undefined)
            patch.contents = dto.contents.trim();
        if (dto.date !== undefined)
            patch.date = dto.date.trim();
        if (dto.deadline !== undefined)
            patch.deadline = dto.deadline.trim();
        if (dto.skill !== undefined)
            patch.skill = dto.skill.trim();
        const updated = { ...sessions[idx], ...patch };
        sessions[idx] = updated;
        await this.storeModel.collection.updateOne({ studentId }, { $set: { sessions } });
        return updated;
    }
    async deleteSession(studentId, no) {
        const sessions = await this.ensureStore(studentId);
        const idx = sessions.findIndex((s) => s.no === no);
        if (idx < 0)
            throw new common_1.NotFoundException(`Không tìm thấy buổi RLP số ${no}`);
        sessions.splice(idx, 1);
        await this.storeModel.collection.updateOne({ studentId }, { $set: { sessions } });
        return { deleted: true };
    }
};
exports.PracticeRlpService = PracticeRlpService;
exports.PracticeRlpService = PracticeRlpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(practice_rlp_store_schema_1.PracticeRlpStore.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PracticeRlpService);
//# sourceMappingURL=practice-rlp.service.js.map