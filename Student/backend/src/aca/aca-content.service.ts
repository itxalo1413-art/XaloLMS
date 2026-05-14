import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isContentStatus } from '../domain/content-status';
import { Category, type CategoryDocument } from './schemas/category.schema';
import { Content, type ContentDocument } from './schemas/content.schema';

type ContentLean = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  categorySlug?: string;
  tags?: string[];
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ContentPublic = {
  id: string;
  title: string;
  description: string;
  categorySlug: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class AcaContentService {
  constructor(
    @InjectModel(Content.name)
    private readonly contentModel: Model<ContentDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  private toPublic(doc: ContentLean): ContentPublic {
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

  async list(params: {
    status?: string;
    category?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: ContentPublic[];
    meta: { page: number; limit: number; total: number };
  }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const query: Record<string, unknown> = {};

    if (params.status) {
      if (!isContentStatus(params.status)) {
        throw new BadRequestException(
          'status phải là draft, pending, published hoặc hidden',
        );
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
      items: rows.map((r) => this.toPublic(r as ContentLean)),
      meta: { page, limit, total },
    };
  }

  async findById(id: string): Promise<ContentPublic> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }
    const doc = await this.contentModel.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');
    return this.toPublic(doc);
  }

  private async assertCategorySlugExists(slug: string): Promise<void> {
    const s = slug.trim().toLowerCase();
    if (!s) return;
    const cat = await this.categoryModel
      .findOne({ slug: s })
      .select('_id')
      .lean()
      .exec();
    if (!cat) {
      throw new BadRequestException(`Không có danh mục với slug: ${s}`);
    }
  }

  async update(
    id: string,
    input: {
      title?: string;
      description?: string;
      categorySlug?: string;
      tags?: string[];
    },
  ): Promise<ContentPublic> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }
    const payload: Record<string, unknown> = {};
    if (input.title !== undefined) {
      const t = input.title.trim();
      if (!t) throw new BadRequestException('Tiêu đề không được để trống');
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
        throw new BadRequestException('tags phải là mảng chuỗi');
      }
      payload.tags = input.tags.map((t) => String(t).trim()).filter(Boolean);
    }
    if (!Object.keys(payload).length) {
      throw new BadRequestException('Không có dữ liệu cập nhật hợp lệ');
    }
    const updated = await this.contentModel
      .findByIdAndUpdate(id, { $set: payload }, { new: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Không tìm thấy tài liệu');
    return this.toPublic(updated);
  }

  async updateStatus(id: string, status: string): Promise<ContentPublic> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }
    if (!isContentStatus(status)) {
      throw new BadRequestException(
        'status phải là draft, pending, published hoặc hidden',
      );
    }
    const updated = await this.contentModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Không tìm thấy tài liệu');
    return this.toPublic(updated);
  }
}
