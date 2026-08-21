import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcademicWarningType =
  | 'absent_notice'
  | 'absent_exceeded'
  | 'homework_insufficient';
export type AcademicWarningRiskLevel = 'warning' | 'high' | 'critical';
export type AcademicWarningHandledStatus =
  | 'pending'
  | 'contacted'
  | 'supplement_scheduled'
  | 'resolved';

export type AcademicWarningDocument = HydratedDocument<AcademicWarning>;

@Schema({ collection: 'academic_warnings', timestamps: true })
export class AcademicWarning {
  @Prop({ required: true, trim: true })
  studentId: string;

  @Prop({ required: true, trim: true })
  studentName: string;

  @Prop({ trim: true, default: '' })
  studentPhone: string;

  @Prop({ trim: true, default: '' })
  studentEmail: string;

  @Prop({ required: true, trim: true })
  classId: string;

  @Prop({ trim: true, default: '' })
  className: string;

  @Prop({ trim: true, default: '' })
  teacherName: string;

  @Prop({ type: Number, default: 3 })
  courseDurationMonths: number;

  @Prop({ trim: true, default: 'Chặng 1 (1.5 tháng - 12/24 buổi)' })
  checkpointPhase: string;

  @Prop({ type: Number, default: 0 })
  totalSessionsElapsed: number;

  @Prop({ type: Number, default: 0 })
  absentCount: number;

  @Prop({ type: Number, default: 0 })
  attendanceRate: number;

  @Prop({ type: Number, default: 0 })
  homeworkSubmitted: number;

  @Prop({ type: Number, default: 0 })
  homeworkTotal: number;

  @Prop({ type: Number, default: 0 })
  homeworkRate: number;

  @Prop({ type: [String], default: [] })
  warningTypes: AcademicWarningType[];

  @Prop({ type: Boolean, default: false })
  notificationSentToStudent: boolean;

  @Prop({ type: Boolean, default: false })
  studentNotificationDismissed: boolean;

  @Prop({
    type: String,
    enum: ['warning', 'high', 'critical'],
    default: 'warning',
  })
  riskLevel: AcademicWarningRiskLevel;

  @Prop({
    type: String,
    enum: ['pending', 'contacted', 'supplement_scheduled', 'resolved'],
    default: 'pending',
  })
  handledStatus: AcademicWarningHandledStatus;

  @Prop({ trim: true, default: '' })
  handlingNote: string;

  /** Nội dung noti học vụ soạn gửi đến học viên. */
  @Prop({ trim: true, default: '' })
  notificationMessage: string;

  @Prop({ trim: true, default: '' })
  lastContactedAt: string;

  @Prop({ trim: true, default: '' })
  classOpenDate: string;

  @Prop({ type: Boolean, default: false })
  firstStageCompleted: boolean;

  @Prop({ type: Number, default: 0 })
  phaseDurationDays: number;

  @Prop({ trim: true, default: '' })
  phaseStartDate: string;

  @Prop({ trim: true, default: '' })
  nextPhaseStartDate: string;
}

export const AcademicWarningSchema =
  SchemaFactory.createForClass(AcademicWarning);

AcademicWarningSchema.index({ studentId: 1, classId: 1 });
AcademicWarningSchema.index({ studentEmail: 1, createdAt: -1 });
AcademicWarningSchema.index({ teacherName: 1, createdAt: -1 });
AcademicWarningSchema.index({ classId: 1, createdAt: -1 });
