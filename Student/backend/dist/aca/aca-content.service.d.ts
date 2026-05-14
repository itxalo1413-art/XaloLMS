import { Model } from 'mongoose';
import { type CategoryDocument } from './schemas/category.schema';
import { type ContentDocument } from './schemas/content.schema';
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
export declare class AcaContentService {
    private readonly contentModel;
    private readonly categoryModel;
    constructor(contentModel: Model<ContentDocument>, categoryModel: Model<CategoryDocument>);
    private toPublic;
    list(params: {
        status?: string;
        category?: string;
        q?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ContentPublic[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    findById(id: string): Promise<ContentPublic>;
    private assertCategorySlugExists;
    update(id: string, input: {
        title?: string;
        description?: string;
        categorySlug?: string;
        tags?: string[];
    }): Promise<ContentPublic>;
    updateStatus(id: string, status: string): Promise<ContentPublic>;
}
