import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PracticeClassWeeklyScoreDocument =
  HydratedDocument<PracticeClassWeeklyScore>;

@Schema({ collection: 'practice_class_weekly_scores', timestamps: true })
export class PracticeClassWeeklyScore {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  weekRange: string;

  @Prop({ default: 0 })
  examWeekNumber: number;

  @Prop({ type: String, default: '' })
  scoreR: string;

  @Prop({ type: String, default: '' })
  scoreL: string;

  @Prop({ type: String, default: '' })
  scoreW: string;
}

export const PracticeClassWeeklyScoreSchema = SchemaFactory.createForClass(
  PracticeClassWeeklyScore,
);

PracticeClassWeeklyScoreSchema.index(
  { userId: 1, weekRange: 1 },
  { unique: true },
);
