import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PRACTICE_SLOT_IDS } from '../practice-class.constants';

export type PracticeClassRegistrationDocument =
  HydratedDocument<PracticeClassRegistration>;

@Schema({ collection: 'practice_class_registrations', timestamps: true })
export class PracticeClassRegistration {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: PRACTICE_SLOT_IDS })
  slotId: string;

  @Prop({ type: String, default: '' })
  linkFolder?: string;

  @Prop({ type: String, default: '' })
  scoreR?: string;

  @Prop({ type: String, default: '' })
  scoreL?: string;

  @Prop({ type: String, default: '' })
  scoreW?: string;
}

export const PracticeClassRegistrationSchema = SchemaFactory.createForClass(
  PracticeClassRegistration,
);

PracticeClassRegistrationSchema.index({ userId: 1, slotId: 1 }, { unique: true });
