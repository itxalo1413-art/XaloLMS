import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaWeeklyDocDocument = HydratedDocument<AcaWeeklyDoc>;

@Schema({ collection: 'aca_weekly_docs', timestamps: true })
export class AcaWeeklyDoc {
  @Prop({ required: true, trim: true })
  student: string;

  /** Email học viên để lọc trên LMS */
  @Prop({ trim: true, default: '', index: true })
  studentEmail: string;

  /** Id học viên ACA / user (tuỳ chọn) */
  @Prop({ trim: true, default: '' })
  studentId: string;

  @Prop({ required: true, trim: true })
  className: string;

  @Prop({ required: true, trim: true })
  week: string;

  @Prop({ trim: true, default: '' })
  link: string;

  @Prop({ required: true, trim: true, default: 'Chưa nộp' })
  status: string; // e.g. "Đã nhận", "Đang chấm", "Chưa nộp"
}

export const AcaWeeklyDocSchema = SchemaFactory.createForClass(AcaWeeklyDoc);
