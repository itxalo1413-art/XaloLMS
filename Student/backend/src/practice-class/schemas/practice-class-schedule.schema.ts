import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { PracticeSlotOverride } from '../practice-class.constants';

export type PracticeClassScheduleDocument =
  HydratedDocument<PracticeClassSchedule>;

@Schema({ collection: 'practice_class_schedules', timestamps: true })
export class PracticeClassSchedule {
  @Prop({ required: true, unique: true, default: 'current' })
  key: string;

  @Prop({ required: true, default: '' })
  weekRangeLabel: string;

  @Prop({ type: Object, required: true, default: {} })
  slotOverrides: Record<string, PracticeSlotOverride>;

  @Prop({ required: true, default: '' })
  zoomId: string;

  @Prop({ required: true, default: '' })
  zoomPassword: string;
}

export const PracticeClassScheduleSchema = SchemaFactory.createForClass(
  PracticeClassSchedule,
);
