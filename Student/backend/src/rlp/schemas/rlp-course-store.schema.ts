import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { RlpSessionRecord } from '../rlp.types';

export const RLP_COURSE_KEY = 'main';

export type RlpCourseStoreDocument = HydratedDocument<RlpCourseStore>;

@Schema({ collection: 'rlp_course_stores', timestamps: true })
export class RlpCourseStore {
  @Prop({ required: true, unique: true, default: RLP_COURSE_KEY })
  key: string;

  @Prop({ type: [Object], default: [] })
  sessions: RlpSessionRecord[];

  /** classId gắn store (đợt RLP theo lớp). */
  @Prop({ trim: true, default: '' })
  classId: string;

  /** Đợt khai giảng (slug openDate), ví dụ 16082026. */
  @Prop({ trim: true, default: '' })
  cohortKey: string;

  @Prop({ trim: true, default: '' })
  migratedTo: string;

  @Prop({ type: Date })
  migratedAt?: Date;
}

export const RlpCourseStoreSchema = SchemaFactory.createForClass(RlpCourseStore);
