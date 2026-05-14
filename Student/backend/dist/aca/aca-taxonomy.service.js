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
exports.AcaTaxonomyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const crypto_1 = require("crypto");
const mongoose_2 = require("mongoose");
const category_schema_1 = require("./schemas/category.schema");
function normalizeSlug(input) {
    const s = input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return s || 'category';
}
function slugFromName(name) {
    return normalizeSlug(name);
}
let AcaTaxonomyService = class AcaTaxonomyService {
    categoryModel;
    constructor(categoryModel) {
        this.categoryModel = categoryModel;
    }
    toPublic(doc) {
        return {
            id: doc._id.toString(),
            name: doc.name,
            slug: doc.slug,
            description: doc.description ?? '',
            createdAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
            updatedAt: doc.updatedAt?.toISOString() ?? new Date(0).toISOString(),
        };
    }
    async list() {
        const rows = await this.categoryModel
            .find()
            .sort({ name: 1 })
            .lean()
            .exec();
        return {
            categories: rows.map((r) => this.toPublic(r)),
        };
    }
    async create(dto) {
        const name = dto.name?.trim();
        if (!name) {
            throw new common_1.BadRequestException('Tên danh mục không được để trống');
        }
        const base = dto.slug?.trim()
            ? normalizeSlug(dto.slug)
            : slugFromName(name);
        let candidate = base;
        for (let i = 0; i < 12; i++) {
            const dup = await this.categoryModel.findOne({ slug: candidate }).exec();
            if (!dup)
                break;
            if (i === 11) {
                throw new common_1.ConflictException('Không tạo được slug duy nhất cho danh mục');
            }
            candidate = `${slugFromName(name)}-${(0, crypto_1.randomBytes)(2).toString('hex')}`;
        }
        const description = (dto.description ?? '').trim();
        const created = await this.categoryModel.create({
            name,
            slug: candidate,
            description,
        });
        return { category: this.toPublic(created.toObject()) };
    }
};
exports.AcaTaxonomyService = AcaTaxonomyService;
exports.AcaTaxonomyService = AcaTaxonomyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(category_schema_1.Category.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AcaTaxonomyService);
//# sourceMappingURL=aca-taxonomy.service.js.map