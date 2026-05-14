import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { ContentStatus } from '../../domain/content-status';

export type ContentDocument = HydratedDocument<Content>;

@Schema({ collection: 'contents', timestamps: true })
export class Content {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: '' })
  description: string;

  /** Slug danh mục (tham chiếu logic tới taxonomy.categories.slug) */
  @Prop({ trim: true, default: '', index: true })
  categorySlug: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    required: true,
    enum: ['draft', 'pending', 'published', 'hidden'],
    default: 'draft',
    index: true,
  })
  status: ContentStatus;
}

export const ContentSchema = SchemaFactory.createForClass(Content);
