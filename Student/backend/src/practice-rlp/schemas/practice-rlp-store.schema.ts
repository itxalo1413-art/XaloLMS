import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { RlpSessionRecord } from '../../rlp/rlp.types';

export type PracticeRlpStoreDocument = HydratedDocument<PracticeRlpStore>;

/** One document per student (keyed by studentId). */
@Schema({ collection: 'practice_rlp_stores', timestamps: true })
export class PracticeRlpStore {
  @Prop({ required: true, unique: true })
  studentId: string;

  @Prop({ type: [Object], default: [] })
  sessions: RlpSessionRecord[];
}

export const PracticeRlpStoreSchema = SchemaFactory.createForClass(PracticeRlpStore);
