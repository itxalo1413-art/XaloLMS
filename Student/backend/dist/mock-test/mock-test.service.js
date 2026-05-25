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
exports.MockTestService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_service_1 = require("../users/users.service");
const mock_test_constants_1 = require("./mock-test.constants");
const mock_test_request_schema_1 = require("./schemas/mock-test-request.schema");
let MockTestService = class MockTestService {
    model;
    users;
    constructor(model, users) {
        this.model = model;
        this.users = users;
    }
    toPublic(doc) {
        const status = (0, mock_test_constants_1.isMockTestStatus)(doc.status) ? doc.status : 'pending';
        const reviewedAt = status !== 'pending' ? doc.updatedAt?.toISOString() : undefined;
        return {
            id: doc._id.toString(),
            studentId: doc.studentId.toString(),
            studentName: doc.studentName,
            skill: doc.skill,
            day: doc.day,
            month: doc.month,
            year: doc.year,
            status,
            requestedAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
            examTime: doc.examTime,
            examTeacher: doc.examTeacher,
            reviewedAt,
            score: doc.score,
            examLink: doc.examLink,
        };
    }
    async findByIdOrThrow(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Không tìm thấy yêu cầu');
        }
        const doc = await this.model.findById(id).lean().exec();
        if (!doc)
            throw new common_1.NotFoundException('Không tìm thấy yêu cầu');
        return doc;
    }
    async hasDuplicateSlot(studentId, skill, day, month, year, excludeId) {
        if (!mongoose_2.Types.ObjectId.isValid(studentId))
            return false;
        const filter = {
            studentId: new mongoose_2.Types.ObjectId(studentId),
            skill: skill.trim(),
            day,
            month,
            year,
            status: { $in: ['pending', 'approved'] },
        };
        if (excludeId && mongoose_2.Types.ObjectId.isValid(excludeId)) {
            filter._id = { $ne: new mongoose_2.Types.ObjectId(excludeId) };
        }
        const count = await this.model.countDocuments(filter).exec();
        return count > 0;
    }
    async listForStudent(studentId) {
        if (!mongoose_2.Types.ObjectId.isValid(studentId))
            return [];
        const rows = await this.model
            .find({ studentId: new mongoose_2.Types.ObjectId(studentId) })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows.map((r) => this.toPublic(r));
    }
    async listForAca(status) {
        const filter = {};
        if (status && status !== 'all' && (0, mock_test_constants_1.isMockTestStatus)(status)) {
            filter.status = status;
        }
        const rows = await this.model
            .find(filter)
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows.map((r) => this.toPublic(r));
    }
    async createForStudent(studentId, payload) {
        if (!mongoose_2.Types.ObjectId.isValid(studentId)) {
            throw new common_1.BadRequestException('userId không hợp lệ');
        }
        const skill = payload.skill?.trim();
        if (!skill)
            throw new common_1.BadRequestException('Thiếu kỹ năng (skill)');
        const day = Number(payload.day);
        const month = Number(payload.month);
        const year = Number(payload.year);
        if (!Number.isInteger(day) ||
            day < 1 ||
            day > 31 ||
            !Number.isInteger(month) ||
            month < 0 ||
            month > 11 ||
            !Number.isInteger(year)) {
            throw new common_1.BadRequestException('Ngày tháng không hợp lệ');
        }
        if (await this.hasDuplicateSlot(studentId, skill, day, month, year)) {
            throw new common_1.ConflictException('Bạn đã có đăng ký cho kỹ năng và ngày này');
        }
        let studentName = 'Học viên';
        try {
            const user = await this.users.getPublicById(studentId);
            studentName = user.name;
        }
        catch {
        }
        const created = await this.model.create({
            studentId: new mongoose_2.Types.ObjectId(studentId),
            studentName,
            skill,
            day,
            month,
            year,
            status: 'pending',
            examTime: payload.examTime?.trim() || undefined,
        });
        return this.toPublic(created.toObject());
    }
    async cancelPending(studentId, id) {
        const doc = await this.findByIdOrThrow(id);
        if (doc.studentId.toString() !== studentId) {
            throw new common_1.NotFoundException('Không tìm thấy yêu cầu');
        }
        if (doc.status !== 'pending') {
            throw new common_1.BadRequestException('Chỉ huỷ được yêu cầu đang chờ duyệt');
        }
        await this.model.deleteOne({ _id: doc._id }).exec();
    }
    async approve(id, payload) {
        const doc = await this.findByIdOrThrow(id);
        if (doc.status !== 'pending') {
            throw new common_1.BadRequestException('Yêu cầu không còn ở trạng thái chờ duyệt');
        }
        const examTime = payload.examTime?.trim() || doc.examTime || '09:00';
        const examTeacher = payload.examTeacher?.trim() || doc.examTeacher;
        const updated = await this.model
            .findByIdAndUpdate(doc._id, {
            $set: {
                status: 'approved',
                examTime,
                examTeacher,
            },
        }, { new: true })
            .lean()
            .exec();
        return this.toPublic(updated);
    }
    async reject(id) {
        const doc = await this.findByIdOrThrow(id);
        if (doc.status !== 'pending') {
            throw new common_1.BadRequestException('Yêu cầu không còn ở trạng thái chờ duyệt');
        }
        const updated = await this.model
            .findByIdAndUpdate(doc._id, { $set: { status: 'rejected' } }, { new: true })
            .lean()
            .exec();
        return this.toPublic(updated);
    }
};
exports.MockTestService = MockTestService;
exports.MockTestService = MockTestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(mock_test_request_schema_1.MockTestRequest.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService])
], MockTestService);
//# sourceMappingURL=mock-test.service.js.map