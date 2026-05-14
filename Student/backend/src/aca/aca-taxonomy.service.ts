import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { Category, type CategoryDocument } from './schemas/category.schema';
import type { CreateCategoryDto } from './dto/create-category.dto';

export type CategoryPublic = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeSlug(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'category';
}

function slugFromName(name: string): string {
  return normalizeSlug(name);
}

@Injectable()
export class AcaTaxonomyService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  private toPublic(doc: {
    _id: { toString(): string };
    name: string;
    slug: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): CategoryPublic {
    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description ?? '',
      createdAt: doc.createdAt?.toISOString() ?? new Date(0).toISOString(),
      updatedAt: doc.updatedAt?.toISOString() ?? new Date(0).toISOString(),
    };
  }

  async list(): Promise<{ categories: CategoryPublic[] }> {
    const rows = await this.categoryModel
      .find()
      .sort({ name: 1 })
      .lean()
      .exec();
    return {
      categories: rows.map((r) => this.toPublic(r)),
    };
  }

  async create(dto: CreateCategoryDto): Promise<{ category: CategoryPublic }> {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Tên danh mục không được để trống');
    }
    const base = dto.slug?.trim()
      ? normalizeSlug(dto.slug)
      : slugFromName(name);
    let candidate = base;
    for (let i = 0; i < 12; i++) {
      const dup = await this.categoryModel.findOne({ slug: candidate }).exec();
      if (!dup) break;
      if (i === 11) {
        throw new ConflictException(
          'Không tạo được slug duy nhất cho danh mục',
        );
      }
      candidate = `${slugFromName(name)}-${randomBytes(2).toString('hex')}`;
    }

    const description = (dto.description ?? '').trim();
    const created = await this.categoryModel.create({
      name,
      slug: candidate,
      description,
    });
    return { category: this.toPublic(created.toObject()) };
  }
}
