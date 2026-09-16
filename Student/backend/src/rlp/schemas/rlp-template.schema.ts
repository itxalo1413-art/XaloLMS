import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { RlpSessionRecord } from '../rlp.types';

export type RlpTemplateDocument = HydratedDocument<RlpTemplate>;

export type RlpTemplateItem = Omit<RlpSessionRecord, 'date' | 'deadline' | 'attendance' | 'homeworkStatus' | 'studentAttendance' | 'studentHomework'> & {
  no: number;
  skill: string;
  contents: string;
  teacherNote?: string;
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  recordingUrl?: string;
};

@Schema({ collection: 'rlp_templates', timestamps: true })
export class RlpTemplate {
  @Prop({ required: true, unique: true, trim: true })
  key: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, default: 'Foundation' })
  level: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ default: 18 })
  totalSessions: number;

  @Prop({ type: [Object], default: [] })
  sessions: RlpTemplateItem[];

  @Prop({ default: true })
  isDefault: boolean;

  @Prop({ trim: true, default: 'Học vụ (ACA)' })
  createdBy: string;
}

export const RlpTemplateSchema = SchemaFactory.createForClass(RlpTemplate);
