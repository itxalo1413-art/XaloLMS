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
exports.StudentProfileService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const student_profile_study_options_1 = require("./student-profile-study-options");
const student_profile_store_schema_1 = require("./schemas/student-profile-store.schema");
const student_profile_types_1 = require("./student-profile.types");
const STUDY_FIELDS = [
    'method',
    'weeklyHours',
    'classEnvironment',
    'ieltsMeaning',
    'previousBand',
    'focusSkills',
];
const SINGLETON_KEY = 'default';
let StudentProfileService = class StudentProfileService {
    store;
    constructor(store) {
        this.store = store;
    }
    mergeWithDefaults(stored) {
        return {
            ...student_profile_types_1.DEFAULT_STUDENT_PROFILE,
            ...(stored ?? {}),
        };
    }
    async getProfile() {
        const doc = await this.store
            .findOne({ singletonKey: SINGLETON_KEY })
            .lean()
            .exec();
        return this.mergeWithDefaults(doc?.profileData);
    }
    async updateProfile(payload) {
        for (const field of STUDY_FIELDS) {
            const raw = payload[field];
            if (raw === undefined || raw === null)
                continue;
            if (typeof raw !== 'string' || !(0, student_profile_study_options_1.isAllowedStudyValue)(field, raw)) {
                throw new common_1.BadRequestException(`Giá trị không hợp lệ cho trường: ${field}`);
            }
        }
        const current = await this.getProfile();
        const next = {
            ...current,
            ...payload,
        };
        await this.store
            .findOneAndUpdate({ singletonKey: SINGLETON_KEY }, {
            $set: { profileData: { ...next } },
            $setOnInsert: { singletonKey: SINGLETON_KEY },
        }, { upsert: true, new: true })
            .exec();
        return next;
    }
    async updateAvatar(file) {
        const mime = file.mimetype || 'image/png';
        const base64 = file.buffer.toString('base64');
        const avatarUrl = `data:${mime};base64,${base64}`;
        const current = await this.getProfile();
        const next = {
            ...current,
            avatarUrl,
        };
        await this.store
            .findOneAndUpdate({ singletonKey: SINGLETON_KEY }, {
            $set: { profileData: { ...next } },
            $setOnInsert: { singletonKey: SINGLETON_KEY },
        }, { upsert: true, new: true })
            .exec();
        return next;
    }
};
exports.StudentProfileService = StudentProfileService;
exports.StudentProfileService = StudentProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(student_profile_store_schema_1.StudentProfileStore.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], StudentProfileService);
//# sourceMappingURL=student-profile.service.js.map