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
var StudentProfileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfileService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_service_1 = require("../users/users.service");
const avatar_image_util_1 = require("./avatar-image.util");
const student_profile_store_schema_1 = require("./schemas/student-profile-store.schema");
const student_profile_study_options_1 = require("./student-profile-study-options");
const focus_skills_util_1 = require("./focus-skills.util");
const student_profile_types_1 = require("./student-profile.types");
const aca_student_schema_1 = require("../aca/schemas/aca-student.schema");
const STUDY_FIELDS = [
    'method',
    'weeklyHours',
    'classEnvironment',
    'ieltsMeaning',
    'previousBand',
    'focusSkills',
];
let StudentProfileService = StudentProfileService_1 = class StudentProfileService {
    store;
    acaStudentModel;
    users;
    cloudinary;
    logger = new common_1.Logger(StudentProfileService_1.name);
    constructor(store, acaStudentModel, users, cloudinary) {
        this.store = store;
        this.acaStudentModel = acaStudentModel;
        this.users = users;
        this.cloudinary = cloudinary;
    }
    mergeWithDefaults(stored) {
        const merged = {
            ...student_profile_types_1.DEFAULT_STUDENT_PROFILE,
            ...(stored ?? {}),
        };
        merged.focusSkills = (0, focus_skills_util_1.normalizeFocusSkills)(stored?.focusSkills ?? merged.focusSkills);
        if (merged.focusSkills.length === 0) {
            merged.focusSkills = [...student_profile_types_1.DEFAULT_STUDENT_PROFILE.focusSkills];
        }
        return merged;
    }
    async defaultForUser(userId) {
        const base = { ...student_profile_types_1.DEFAULT_STUDENT_PROFILE };
        try {
            const user = await this.users.getPublicById(userId);
            base.name = user.name;
            base.email = user.email;
        }
        catch {
        }
        return base;
    }
    async getProfile(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            return this.defaultForUser(userId);
        }
        const doc = await this.store
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
            .lean()
            .exec();
        if (!doc?.profileData) {
            return this.defaultForUser(userId);
        }
        return this.mergeWithDefaults(doc.profileData);
    }
    async persist(userId, next) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('userId không hợp lệ');
        }
        await this.store
            .findOneAndUpdate({ userId: new mongoose_2.Types.ObjectId(userId) }, {
            $set: { profileData: { ...next } },
            $setOnInsert: { userId: new mongoose_2.Types.ObjectId(userId) },
        }, { upsert: true, returnDocument: 'after' })
            .exec();
        return next;
    }
    async updateProfile(userId, payload) {
        for (const field of STUDY_FIELDS) {
            if (field === 'focusSkills')
                continue;
            const raw = payload[field];
            if (raw === undefined || raw === null)
                continue;
            if (typeof raw !== 'string' || !(0, student_profile_study_options_1.isAllowedStudyValue)(field, raw)) {
                throw new common_1.BadRequestException(`Giá trị không hợp lệ cho trường: ${field}`);
            }
        }
        const focusSkillsUpdate = (0, focus_skills_util_1.parseFocusSkillsPayload)(payload.focusSkills);
        if (payload.focusSkills !== undefined && focusSkillsUpdate === undefined) {
            throw new common_1.BadRequestException('Giá trị không hợp lệ cho trường: focusSkills');
        }
        const current = await this.getProfile(userId);
        const { focusSkills: _fs, ...rest } = payload;
        const next = {
            ...current,
            ...rest,
            ...(focusSkillsUpdate !== undefined
                ? { focusSkills: focusSkillsUpdate }
                : {}),
        };
        return this.persist(userId, next);
    }
    async updateAvatar(userId, file) {
        const mime = file.mimetype || '';
        if (!(0, avatar_image_util_1.isAllowedAvatarImageMime)(mime)) {
            throw new common_1.BadRequestException('Chỉ chấp nhận ảnh: JPEG, PNG, GIF, WebP, SVG.');
        }
        let avatarUrl;
        if (this.cloudinary.isConfigured()) {
            try {
                avatarUrl = await this.cloudinary.uploadAvatar(userId, file);
            }
            catch (err) {
                this.logger.warn(`Cloudinary upload failed, fallback base64: ${err instanceof Error ? err.message : err}`);
                const base64 = file.buffer.toString('base64');
                avatarUrl = `data:${mime.split(';')[0]};base64,${base64}`;
            }
        }
        else {
            const base64 = file.buffer.toString('base64');
            avatarUrl = `data:${mime.split(';')[0]};base64,${base64}`;
        }
        const current = await this.getProfile(userId);
        const next = {
            ...current,
            avatarUrl,
        };
        return this.persist(userId, next);
    }
    async getStudentDiagnosis(email) {
        if (!email)
            return null;
        const cleanEmail = email.trim().toLowerCase();
        const student = await this.acaStudentModel
            .findOne({ email: cleanEmail })
            .lean()
            .exec();
        if (!student) {
            return null;
        }
        return {
            name: student.name,
            email: student.email,
            phone: student.phone,
            classId: student.classId,
            bcbLink: student.bcbLink || '',
            scores: {
                listening: student.scores?.l !== undefined && student.scores?.l !== '-' ? Number(student.scores.l) : 0,
                reading: student.scores?.r !== undefined && student.scores?.r !== '-' ? Number(student.scores.r) : 0,
                writing: student.scores?.w !== undefined && student.scores?.w !== '-' ? Number(student.scores.w) : 0,
                speaking: student.scores?.s !== undefined && student.scores?.s !== '-' ? Number(student.scores.s) : 0,
                overall: student.scores?.o !== undefined && student.scores?.o !== '-' ? Number(student.scores.o) : 0,
            },
            finalScores: {
                listening: student.finalScores?.l !== undefined && student.finalScores?.l !== '-' ? Number(student.finalScores.l) : 0,
                reading: student.finalScores?.r !== undefined && student.finalScores?.r !== '-' ? Number(student.finalScores.r) : 0,
                writing: student.finalScores?.w !== undefined && student.finalScores?.w !== '-' ? Number(student.finalScores.w) : 0,
                speaking: student.finalScores?.s !== undefined && student.finalScores?.s !== '-' ? Number(student.finalScores.s) : 0,
                overall: student.finalScores?.o !== undefined && student.finalScores?.o !== '-' ? Number(student.finalScores.o) : 0,
            }
        };
    }
};
exports.StudentProfileService = StudentProfileService;
exports.StudentProfileService = StudentProfileService = StudentProfileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(student_profile_store_schema_1.StudentProfileStore.name)),
    __param(1, (0, mongoose_1.InjectModel)(aca_student_schema_1.AcaStudent.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService,
        cloudinary_service_1.CloudinaryService])
], StudentProfileService);
//# sourceMappingURL=student-profile.service.js.map