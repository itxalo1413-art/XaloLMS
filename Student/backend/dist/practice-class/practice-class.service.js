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
exports.PracticeClassService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_service_1 = require("../users/users.service");
const practice_class_constants_1 = require("./practice-class.constants");
const practice_class_registration_schema_1 = require("./schemas/practice-class-registration.schema");
const practice_class_schedule_schema_1 = require("./schemas/practice-class-schedule.schema");
let PracticeClassService = class PracticeClassService {
    scheduleModel;
    registrationModel;
    usersService;
    constructor(scheduleModel, registrationModel, usersService) {
        this.scheduleModel = scheduleModel;
        this.registrationModel = registrationModel;
        this.usersService = usersService;
    }
    mergeSlot(base, override) {
        if (!override)
            return { ...base };
        const dateNote = override.dateNote?.trim();
        return {
            ...base,
            dayLabel: override.dayLabel?.trim() || base.dayLabel,
            time: override.time?.trim() || base.time,
            ...(dateNote ? { dateNote } : {}),
        };
    }
    buildScheduleResponse(doc, overrides) {
        return {
            weekRangeLabel: doc?.weekRangeLabel?.trim() ?? '',
            updatedAt: doc?.updatedAt?.toISOString() ?? null,
            slots: practice_class_constants_1.PRACTICE_SLOT_DEFINITIONS.map((base) => this.mergeSlot(base, overrides[base.id])),
        };
    }
    async getSchedule() {
        const doc = await this.scheduleModel
            .findOne({ key: practice_class_constants_1.PRACTICE_SCHEDULE_KEY })
            .lean()
            .exec();
        const overrides = doc?.slotOverrides ?? {};
        return this.buildScheduleResponse(doc, overrides);
    }
    async updateSchedule(payload) {
        const normalized = {};
        for (const id of practice_class_constants_1.PRACTICE_SLOT_IDS) {
            const base = practice_class_constants_1.PRACTICE_SLOT_DEFINITIONS.find((s) => s.id === id);
            const raw = payload.slots?.[id];
            const dayLabel = raw?.dayLabel?.trim() || base.dayLabel;
            const time = raw?.time?.trim() || base.time;
            const dateNote = raw?.dateNote?.trim();
            normalized[id] = {
                dayLabel,
                time,
                ...(dateNote ? { dateNote } : {}),
            };
        }
        const doc = await this.scheduleModel
            .findOneAndUpdate({ key: practice_class_constants_1.PRACTICE_SCHEDULE_KEY }, {
            $set: {
                key: practice_class_constants_1.PRACTICE_SCHEDULE_KEY,
                weekRangeLabel: payload.weekRangeLabel?.trim() ?? '',
                slotOverrides: normalized,
            },
        }, { upsert: true, new: true })
            .lean()
            .exec();
        return this.buildScheduleResponse(doc, doc?.slotOverrides ?? normalized);
    }
    async listRegistrations(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId))
            return [];
        const rows = await this.registrationModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .sort({ createdAt: 1 })
            .lean()
            .exec();
        return rows.map((row) => ({
            slotId: row.slotId,
            registeredAt: row.createdAt?.toISOString() ??
                new Date(0).toISOString(),
        }));
    }
    async registerSlot(userId, slotId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('userId không hợp lệ');
        }
        if (!(0, practice_class_constants_1.isPracticeSlotId)(slotId)) {
            throw new common_1.BadRequestException('slotId không hợp lệ');
        }
        const existing = await this.registrationModel
            .findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
            slotId,
        })
            .lean()
            .exec();
        if (existing) {
            throw new common_1.ConflictException('Đã đăng ký buổi này');
        }
        const created = await this.registrationModel.create({
            userId: new mongoose_2.Types.ObjectId(userId),
            slotId,
        });
        const doc = created.toObject();
        return {
            slotId: doc.slotId,
            registeredAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
        };
    }
    async listAllRegistrationsForAca() {
        const [rows, schedule] = await Promise.all([
            this.registrationModel.find().sort({ createdAt: -1 }).lean().exec(),
            this.getSchedule(),
        ]);
        const userIds = [...new Set(rows.map((row) => row.userId.toString()))];
        const names = await this.usersService.findNamesByIds(userIds);
        const slotById = Object.fromEntries(schedule.slots.map((slot) => [slot.id, slot]));
        return rows.map((row) => {
            const slot = slotById[row.slotId];
            const studentId = row.userId.toString();
            return {
                studentId,
                studentName: names.get(studentId) ?? studentId,
                slotId: row.slotId,
                slotTitle: slot?.title ?? row.slotId,
                slotSchedule: slot ? `${slot.dayLabel} · ${slot.time}` : '—',
                registeredAt: row.createdAt?.toISOString() ??
                    new Date(0).toISOString(),
            };
        });
    }
    async unregisterSlot(userId, slotId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('userId không hợp lệ');
        }
        if (!(0, practice_class_constants_1.isPracticeSlotId)(slotId)) {
            throw new common_1.BadRequestException('slotId không hợp lệ');
        }
        const result = await this.registrationModel
            .deleteOne({
            userId: new mongoose_2.Types.ObjectId(userId),
            slotId,
        })
            .exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Chưa đăng ký buổi này');
        }
    }
};
exports.PracticeClassService = PracticeClassService;
exports.PracticeClassService = PracticeClassService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(practice_class_schedule_schema_1.PracticeClassSchedule.name)),
    __param(1, (0, mongoose_1.InjectModel)(practice_class_registration_schema_1.PracticeClassRegistration.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService])
], PracticeClassService);
//# sourceMappingURL=practice-class.service.js.map