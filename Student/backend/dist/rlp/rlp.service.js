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
        return rlp_defaults_1.DEFAULT_RLP_SESSIONS.map((s) => ({
            lessonFileUrl: '',
            homeworkFileUrl: '',
            recordingUrl: '',
            ...s,
        }));
    }
    generateClassScheduleDates(startDateStr, nextPhaseStartDateStr, className, totalSessions = 20) {
        const is357 = className.includes('357');
        const targetDays = is357 ? [2, 4, 6] : [1, 3, 5];
        const parseDate = (dStr) => {
            const parts = dStr.split('/');
            if (parts.length !== 3)
                return new Date();
            return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        };
        const startDate = parseDate(startDateStr);
        const walkDates = (start, count) => {
            const dates = [];
            const curr = new Date(start);
            let guard = 0;
            while (dates.length < count && guard < 1000) {
                if (targetDays.includes(curr.getDay())) {
                    dates.push(new Date(curr));
                }
                curr.setDate(curr.getDate() + 1);
                guard++;
            }
            return dates;
        };
        const phase1Dates = walkDates(startDate, 12);
        const result = [];
        phase1Dates.forEach((d) => {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            result.push(`${dd}/${mm}/${d.getFullYear()}`);
        });
        let phase2Start;
        if (nextPhaseStartDateStr) {
            phase2Start = parseDate(nextPhaseStartDateStr);
        }
        else {
            phase2Start = new Date(phase1Dates[phase1Dates.length - 1] || startDate);
            phase2Start.setDate(phase2Start.getDate() + 2);
        }
        const phase2Dates = walkDates(phase2Start, totalSessions - 12);
        phase2Dates.forEach((d) => {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            result.push(`${dd}/${mm}/${d.getFullYear()}`);
        });
        return result;
    }
    async ensureStoreForClass(classId) {
        if (!classId) {
            return this.ensureStore();
        }
        const storeKey = `rlp_store_${classId}`;
        let doc = await this.storeModel.findOne({ key: storeKey }).lean().exec();
        const mainSessions = await this.ensureStore();
        const mainMap = new Map(mainSessions.map((s) => [s.no, s]));
        const cls = await this.classModel.findById(classId).lean().exec();
        const className = cls?.name || cls?.classCode || '';
        const startDateStr = cls?.phaseStartDate || cls?.openDate;
        const computedDates = startDateStr
            ? this.generateClassScheduleDates(startDateStr, cls?.nextPhaseStartDate, className, mainSessions.length)
            : [];
        if (doc?.sessions?.length) {
            let modified = false;
            const updatedSessions = doc.sessions.map((s, idx) => {
                const main = mainMap.get(s.no);
                let sUpdated = false;
                const next = { ...s };
                if (computedDates[idx] && next.date !== computedDates[idx]) {
                    next.date = computedDates[idx];
                    sUpdated = true;
                }
                if (main) {
                    if (!next.recordingUrl && main.recordingUrl) {
                        next.recordingUrl = main.recordingUrl;
                        sUpdated = true;
                    }
                    if ((!next.teacherNote || next.teacherNote === '—') && main.teacherNote && main.teacherNote !== '—') {
                        next.teacherNote = main.teacherNote;
                        sUpdated = true;
                    }
                    if ((!next.homeworkStatus || next.homeworkStatus === 'not_assigned') && main.homeworkStatus && main.homeworkStatus !== 'not_assigned') {
                        next.homeworkStatus = main.homeworkStatus;
                        sUpdated = true;
                    }
                }
                if (sUpdated)
                    modified = true;
                return next;
            });
            if (modified) {
                await this.storeModel.collection.updateOne({ key: storeKey }, { $set: { sessions: updatedSessions } });
                return updatedSessions;
            }
            return doc.sessions;
        }
        const baseSessions = mainSessions.map((s, idx) => {
            const copy = { ...s };
            if (computedDates[idx]) {
                copy.date = computedDates[idx];
            }
            return copy;
        });
        await this.storeModel.collection.updateOne({ key: storeKey }, { $set: { sessions: baseSessions } }, { upsert: true });
        return baseSessions;
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
        const MOCK_NOTES = new Set([
            "Đã nắm được đủ cấu trúc trả lời Part 1, mở rộng ví linh hoạt được.",
            "Hiểu yêu cầu Part 2, thiếu từ vựng cụ thể, cần luyện thêm chèn story.",
            "Nắm cách định vị đáp án Completion, làm được từ khóa T/F/NG.",
            "Cần chú ý hạ giọng khi phát âm, đã biết ở cuối câu hay cụm từ.",
            "Nắm được cách kéo dài để suy nghĩ idea cho Part 3.",
            "Hiểu cách đọc dày để áp dụng vào bài Matching headings.",
            "Hiểu ứng dụng cleft sentence, cần luyện thêm để thành nhuần nhuyễn.",
            "Nắm mẫu câu tạo ngữ căn bản, cần luyện phát âm nguyên âm đôi.",
            "Xử lý tốt dạng multiple choice đoạn học thuật.",
            "Diễn đạt hẹp hơn, nắm thành phần câu cơ bản.",
            "Luyện cụm động từ danh từ, đa phần hình thành cụm danh từ cơ bản.",
            "Nắm cách đọc lấy thông tin và so sánh với câu hỏi.",
        ]);
        return sessions.map((s) => {
            const note = s.teacherNote?.trim() ?? "";
            const isMockNote = MOCK_NOTES.has(note);
            return {
                ...s,
                teacherNote: isMockNote || !note ? "—" : note,
                lessonFileUrl: s.lessonFileUrl?.trim() ?? '',
                homeworkFileUrl: s.homeworkFileUrl?.trim() ?? '',
                recordingUrl: s.recordingUrl?.trim() ?? '',
            };
        });
    }
    async listSessions() {
        return this.normalizeSessions(await this.ensureStore());
    }
    async listSessionsForStudent(email) {
        if (!email)
            return this.listSessions();
        const student = await this.studentModel.findOne({ email }).lean().exec();
        if (!student || !student.classId || student.classId === 'cls_placeholder') {
            return this.listSessions();
        }
        const classSessions = await this.ensureStoreForClass(student.classId);
        const mainSessions = await this.ensureStore();
        const mainMap = new Map(mainSessions.map((s) => [s.no, s]));
        const merged = classSessions.map((s) => {
            const main = mainMap.get(s.no);
            if (!main)
                return s;
            return {
                ...s,
                recordingUrl: (s.recordingUrl && s.recordingUrl.trim() !== '') ? s.recordingUrl : (main.recordingUrl || ''),
                teacherNote: (s.teacherNote && s.teacherNote !== '—') ? s.teacherNote : (main.teacherNote || s.teacherNote),
                homeworkStatus: (s.homeworkStatus && s.homeworkStatus !== 'not_assigned') ? s.homeworkStatus : (main.homeworkStatus || s.homeworkStatus),
                attendance: s.attendance || main.attendance || 'present',
            };
        });
        return this.normalizeSessions(merged);
    }
    async listSessionsForClass(classId) {
        if (!classId)
            return this.listSessions();
        return this.normalizeSessions(await this.ensureStoreForClass(classId));
    }
    async updateSession(no, payload) {
        const patchObj = {};
        if (payload.attendance !== undefined)
            patchObj.attendance = payload.attendance;
        if (payload.homeworkStatus !== undefined)
            patchObj.homeworkStatus = payload.homeworkStatus;
        if (payload.teacherNote !== undefined)
            patchObj.teacherNote = payload.teacherNote.trim();
        if (payload.lessonFileUrl !== undefined)
            patchObj.lessonFileUrl = payload.lessonFileUrl.trim();
        if (payload.homeworkFileUrl !== undefined)
            patchObj.homeworkFileUrl = payload.homeworkFileUrl.trim();
        if (payload.recordingUrl !== undefined)
            patchObj.recordingUrl = payload.recordingUrl.trim();
        if (payload.contents !== undefined)
            patchObj.contents = payload.contents.trim();
        if (payload.date !== undefined)
            patchObj.date = payload.date.trim();
        if (payload.deadline !== undefined)
            patchObj.deadline = payload.deadline.trim();
        if (payload.skill !== undefined)
            patchObj.skill = payload.skill.trim();
        const mainSessions = await this.ensureStore();
        const mainIdx = mainSessions.findIndex((s) => s.no === no);
        if (mainIdx < 0) {
            throw new common_1.NotFoundException('Không tìm thấy buổi RLP');
        }
        const updatedMain = { ...mainSessions[mainIdx], ...patchObj };
        mainSessions[mainIdx] = updatedMain;
        await this.storeModel.collection.updateOne({ key: rlp_course_store_schema_1.RLP_COURSE_KEY }, { $set: { sessions: mainSessions } }, { upsert: true });
        const allStores = await this.storeModel.find({}).lean().exec();
        for (const store of allStores) {
            if (store.key === rlp_course_store_schema_1.RLP_COURSE_KEY)
                continue;
            const cSessions = store.sessions || [];
            const cIdx = cSessions.findIndex((s) => s.no === no);
            if (cIdx >= 0) {
                cSessions[cIdx] = { ...cSessions[cIdx], ...patchObj };
                await this.storeModel.collection.updateOne({ key: store.key }, { $set: { sessions: cSessions } });
            }
        }
        return updatedMain;
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
        const patchObj = {};
        if (payload.attendance !== undefined)
            patchObj.attendance = payload.attendance;
        if (payload.homeworkStatus !== undefined)
            patchObj.homeworkStatus = payload.homeworkStatus;
        if (payload.teacherNote !== undefined)
            patchObj.teacherNote = payload.teacherNote.trim();
        if (payload.lessonFileUrl !== undefined)
            patchObj.lessonFileUrl = payload.lessonFileUrl.trim();
        if (payload.homeworkFileUrl !== undefined)
            patchObj.homeworkFileUrl = payload.homeworkFileUrl.trim();
        if (payload.recordingUrl !== undefined)
            patchObj.recordingUrl = payload.recordingUrl.trim();
        if (payload.contents !== undefined)
            patchObj.contents = payload.contents.trim();
        if (payload.date !== undefined)
            patchObj.date = payload.date.trim();
        if (payload.deadline !== undefined)
            patchObj.deadline = payload.deadline.trim();
        if (payload.skill !== undefined)
            patchObj.skill = payload.skill.trim();
        const updated = { ...current, ...patchObj };
        sessions[index] = updated;
        await this.storeModel.collection.updateOne({ key: storeKey }, { $set: { sessions } });
        const mainSessions = await this.ensureStore();
        const mainIdx = mainSessions.findIndex((s) => s.no === no);
        if (mainIdx >= 0) {
            mainSessions[mainIdx] = { ...mainSessions[mainIdx], ...patchObj };
            await this.storeModel.collection.updateOne({ key: rlp_course_store_schema_1.RLP_COURSE_KEY }, { $set: { sessions: mainSessions } }, { upsert: true });
        }
        return updated;
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