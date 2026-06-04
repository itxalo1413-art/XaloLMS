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
}

export const RlpCourseStoreSchema = SchemaFactory.createForClass(RlpCourseStore);
