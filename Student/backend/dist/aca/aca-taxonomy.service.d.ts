import { Model } from 'mongoose';
import { type CategoryDocument } from './schemas/category.schema';
import type { CreateCategoryDto } from './dto/create-category.dto';
export type CategoryPublic = {
    id: string;
    name: string;
    slug: string;
    description: string;
    createdAt: string;
    updatedAt: string;
};
export declare class AcaTaxonomyService {
    private readonly categoryModel;
    constructor(categoryModel: Model<CategoryDocument>);
    private toPublic;
    list(): Promise<{
        categories: CategoryPublic[];
    }>;
    create(dto: CreateCategoryDto): Promise<{
        category: CategoryPublic;
    }>;
}
