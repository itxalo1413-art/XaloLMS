import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaPracticeWeekDocument = HydratedDocument<AcaPracticeWeek>;

@Schema({ collection: 'aca_practice_weeks', timestamps: true })
export class AcaPracticeWeek {
  @Prop({ required: true, unique: true, trim: true })
  weekRange: string; // e.g. "08/06/2026 - 14/06/2026"

  @Prop({ trim: true, default: '' })
  linkMeet: string;

  @Prop({ trim: true, default: '' })
  linkTab: string;

  @Prop({ trim: true, default: '' })
  announcement: string;

  @Prop({ trim: true, default: '' })
  templateMessage: string;
}

export const AcaPracticeWeekSchema = SchemaFactory.createForClass(AcaPracticeWeek);
