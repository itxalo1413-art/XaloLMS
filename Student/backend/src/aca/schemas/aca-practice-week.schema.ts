import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaPracticeWeekDocument = HydratedDocument<AcaPracticeWeek>;

@Schema({ collection: 'aca_practice_weeks', timestamps: true, strict: false })
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

  @Prop({ trim: true, default: '842 1963 4521' })
  zoomId: string;

  @Prop({ trim: true, default: 'XaloLrw26' })
  zoomPassword: string;

  @Prop({ trim: true, default: '' })
  scheduleTueInfo: string;

  @Prop({ trim: true, default: '' })
  scheduleThuInfo: string;

  @Prop({ trim: true, default: '' })
  scheduleSatInfo: string;

  @Prop({ trim: true, default: '' })
  scheduleTueTitle: string;

  @Prop({ trim: true, default: '' })
  scheduleThuTitle: string;

  @Prop({ trim: true, default: '' })
  scheduleSatTitle: string;

  @Prop({ trim: true, default: '' })
  scheduleTueTime: string;

  @Prop({ trim: true, default: '' })
  scheduleThuTime: string;

  @Prop({ trim: true, default: '' })
  scheduleSatTime: string;

  @Prop({ trim: true, default: '' })
  linkFolder: string; // Link Folder Bài Tập Cá Nhân và điểm mỗi tuần
}

export const AcaPracticeWeekSchema = SchemaFactory.createForClass(AcaPracticeWeek);
