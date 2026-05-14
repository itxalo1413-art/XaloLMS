"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const mongoose_2 = require("mongoose");
const role_1 = require("../domain/role");
const user_status_1 = require("../domain/user-status");
const user_schema_1 = require("./schemas/user.schema");
const SALT_ROUNDS = 10;
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async onModuleInit() {
        await this.userModel
            .updateMany({ status: { $exists: false } }, { $set: { status: 'ACTIVE' } })
            .exec();
        await this.ensureSeedAca();
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    toPublic(doc) {
        return {
            id: doc._id.toString(),
            email: doc.email,
            name: doc.name,
            role: doc.role,
            status: doc.status ?? 'ACTIVE',
            createdAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
        };
    }
    async ensureSeedAca() {
        const email = this.normalizeEmail(process.env.ACA_SEED_EMAIL ?? 'aca@xalo.internal');
        const existing = await this.userModel.findOne({ email }).exec();
        if (existing)
            return;
        const password = process.env.ACA_SEED_PASSWORD ?? 'ChangeMe_Aca1!';
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        await this.userModel.create({
            email,
            name: process.env.ACA_SEED_NAME ?? 'Quản trị ACA',
            role: 'ACA',
            status: 'ACTIVE',
            passwordHash,
        });
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email: this.normalizeEmail(email) }).exec();
    }
    async findPublicById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            return undefined;
        const doc = await this.userModel.findById(id).lean().exec();
        if (!doc)
            return undefined;
        return this.toPublic(doc);
    }
    async listPublic(params) {
        const page = Math.max(1, params?.page ?? 1);
        const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
        const query = {};
        if (params?.role) {
            if (!(0, role_1.isRole)(params.role)) {
                throw new common_1.BadRequestException('role phải là HS, GV hoặc ACA');
            }
            query.role = params.role;
        }
        if (params?.status) {
            if (!(0, user_status_1.isUserStatus)(params.status)) {
                throw new common_1.BadRequestException('status phải là ACTIVE hoặc INACTIVE');
            }
            if (params.status === 'ACTIVE') {
                const currentOr = Array.isArray(query.$or)
                    ? query.$or
                    : [];
                query.$or = [
                    ...currentOr,
                    { status: 'ACTIVE' },
                    { status: { $exists: false } },
                ];
            }
            else {
                query.status = params.status;
            }
        }
        if (params?.q?.trim()) {
            const keyword = params.q.trim();
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
            ];
        }
        const [rows, total] = await Promise.all([
            this.userModel
                .find(query)
                .sort({ createdAt: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec(),
            this.userModel.countDocuments(query).exec(),
        ]);
        return {
            users: rows.map((doc) => this.toPublic(doc)),
            meta: { page, limit, total },
        };
    }
    async validateCredentials(email, password) {
        const user = await this.findByEmail(email);
        if (!user)
            return null;
        if (user.status !== 'ACTIVE')
            return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            return null;
        const lean = user.toObject();
        return this.toPublic(lean);
    }
    async createUser(input) {
        const name = input.name?.trim();
        const emailRaw = input.email?.trim();
        const password = input.password ?? '';
        if (!name) {
            throw new common_1.BadRequestException('Tên không được để trống');
        }
        if (!emailRaw || !emailRaw.includes('@')) {
            throw new common_1.BadRequestException('Email không hợp lệ');
        }
        if (password.length < 8) {
            throw new common_1.BadRequestException('Mật khẩu cần ít nhất 8 ký tự');
        }
        if (!(0, role_1.isRole)(input.role)) {
            throw new common_1.BadRequestException('Vai trò phải là HS, GV hoặc ACA');
        }
        const email = this.normalizeEmail(emailRaw);
        const dup = await this.userModel.findOne({ email }).exec();
        if (dup) {
            throw new common_1.ConflictException('Email đã được sử dụng');
        }
        const role = input.role;
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const created = await this.userModel.create({
            email,
            name,
            role,
            status: 'ACTIVE',
            passwordHash,
        });
        return this.toPublic(created.toObject());
    }
    async getPublicById(id) {
        const user = await this.findPublicById(id);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy user');
        }
        return user;
    }
    async updateUser(id, input) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Không tìm thấy user');
        }
        const payload = {};
        if (input.name !== undefined) {
            const name = input.name.trim();
            if (!name) {
                throw new common_1.BadRequestException('Tên không được để trống');
            }
            payload.name = name;
        }
        if (input.role !== undefined) {
            if (!(0, role_1.isRole)(input.role)) {
                throw new common_1.BadRequestException('Vai trò phải là HS, GV hoặc ACA');
            }
            payload.role = input.role;
        }
        if (input.status !== undefined) {
            if (!(0, user_status_1.isUserStatus)(input.status)) {
                throw new common_1.BadRequestException('status phải là ACTIVE hoặc INACTIVE');
            }
            payload.status = input.status;
        }
        if (!Object.keys(payload).length) {
            throw new common_1.BadRequestException('Không có dữ liệu cập nhật hợp lệ');
        }
        const updated = await this.userModel
            .findByIdAndUpdate(id, { $set: payload }, { new: true })
            .lean()
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException('Không tìm thấy user');
        }
        return this.toPublic(updated);
    }
    async updatePassword(id, newPassword) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Không tìm thấy user');
        }
        if (newPassword.length < 8) {
            throw new common_1.BadRequestException('Mật khẩu cần ít nhất 8 ký tự');
        }
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        const updated = await this.userModel
            .findByIdAndUpdate(id, { $set: { passwordHash } }, { new: true })
            .select('_id')
            .lean()
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException('Không tìm thấy user');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map