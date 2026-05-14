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
exports.AcaContentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const content_status_1 = require("../domain/content-status");
const category_schema_1 = require("./schemas/category.schema");
const content_schema_1 = require("./schemas/content.schema");
let AcaContentService = class AcaContentService {
    contentModel;
    categoryModel;
    constructor(contentModel, categoryModel) {
        this.contentModel = contentModel;
        this.categoryModel = categoryModel;
    }
    toPublic(doc) {
        return {
            id: doc._id.toString(),
            title: doc.title,
            description: doc.description ?? '',
            categorySlug: doc.categorySlug ?? '',
            tags: doc.tags ?? [],
            status: doc.status,
            createdAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
            updatedAt: doc.updatedAt?.toISOString() ?? new Date(0).toISOString(),
        };
    }
    async list(params) {
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(100, Math.max(1, params.limit ?? 20));
        const query = {};
        if (params.status) {
            if (!(0, content_status_1.isContentStatus)(params.status)) {
                throw new common_1.BadRequestException('status phải là draft, pending, published hoặc hidden');
            }
            query.status = params.status;
        }
        if (params.category?.trim()) {
            query.categorySlug = params.category.trim().toLowerCase();
        }
        if (params.q?.trim()) {
            const keyword = params.q.trim();
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
            ];
        }
        const [rows, total] = await Promise.all([
            this.contentModel
                .find(query)
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec(),
            this.contentModel.countDocuments(query).exec(),
        ]);
        return {
            items: rows.map((r) => this.toPublic(r)),
            meta: { page, limit, total },
        };
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Không tìm thấy tài liệu');
        }
        const doc = await this.contentModel.findById(id).lean().exec();
        if (!doc)
            throw new common_1.NotFoundException('Không tìm thấy tài liệu');
        return this.toPublic(doc);
    }
    async assertCategorySlugExists(slug) {
        const s = slug.trim().toLowerCase();
        if (!s)
            return;
        const cat = await this.categoryModel.findOne({ slug: s }).select('_id').lean().exec();
        if (!cat) {
            throw new common_1.BadRequestException(`Không có danh mục với slug: ${s}`);
        }
    }
    async update(id, input) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Không tìm thấy tài liệu');
        }
        const payload = {};
        if (input.title !== undefined) {
            const t = input.title.trim();
            if (!t)
                throw new common_1.BadRequestException('Tiêu đề không được để trống');
            payload.title = t;
        }
        if (input.description !== undefined) {
            payload.description = String(input.description);
        }
        if (input.categorySlug !== undefined) {
            const cs = input.categorySlug.trim().toLowerCase();
            await this.assertCategorySlugExists(cs);
            payload.categorySlug = cs;
        }
        if (input.tags !== undefined) {
            if (!Array.isArray(input.tags)) {
                throw new common_1.BadRequestException('tags phải là mảng chuỗi');
            }
            payload.tags = input.tags.map((t) => String(t).trim()).filter(Boolean);
        }
        if (!Object.keys(payload).length) {
            throw new common_1.BadRequestException('Không có dữ liệu cập nhật hợp lệ');
        }
        const updated = await this.contentModel
            .findByIdAndUpdate(id, { $set: payload }, { new: true })
            .lean()
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Không tìm thấy tài liệu');
        return this.toPublic(updated);
    }
    async updateStatus(id, status) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Không tìm thấy tài liệu');
        }
        if (!(0, content_status_1.isContentStatus)(status)) {
            throw new common_1.BadRequestException('status phải là draft, pending, published hoặc hidden');
        }
        const updated = await this.contentModel
            .findByIdAndUpdate(id, { $set: { status } }, { new: true })
            .lean()
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Không tìm thấy tài liệu');
        return this.toPublic(updated);
    }
};
exports.AcaContentService = AcaContentService;
exports.AcaContentService = AcaContentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(content_schema_1.Content.name)),
    __param(1, (0, mongoose_1.InjectModel)(category_schema_1.Category.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AcaContentService);
//# sourceMappingURL=aca-content.service.js.map