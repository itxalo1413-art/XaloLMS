import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type FinalTestType = 'full_4_skills' | 'speaking' | 'writing' | 'lr';
export type FinalTestStatus = 'scheduled' | 'in_progress' | 'graded' | 'cancelled';
export type FinalTestFormat = 'online' | 'offline';
export type FinalTestDocument = HydratedDocument<FinalTest>;

@Schema({ collection: 'final_tests', timestamps: true })
export class FinalTest {
  @Prop({ required: true, trim: true })
  candidateName: string;

  @Prop({ trim: true, default: '' })
  candidatePhone: string;

  @Prop({ trim: true, default: '' })
  candidateEmail: string;

  @Prop({ trim: true, default: '', index: true })
  studentId: string;

  @Prop({ trim: true, default: '' })
  classCode: string;

  @Prop({ trim: true, default: '' })
  className: string;

  @Prop({ trim: true, default: '' })
  targetBand: string;

  @Prop({
    type: String,
    enum: ['full_4_skills', 'speaking', 'writing', 'lr'],
    default: 'full_4_skills',
  })
  testType: FinalTestType;

  @Prop({
    type: String,
    enum: ['online', 'offline'],
    default: 'online',
  })
  format: FinalTestFormat;

  @Prop({ trim: true, default: '', index: true })
  examinerName: string;

  @Prop({ trim: true, default: '' })
  date: string;

  @Prop({ trim: true, default: '' })
  time: string;

  @Prop({ type: Number, default: 0 })
  day: number;

  @Prop({ type: Number, default: 0 })
  month: number;

  @Prop({ type: Number, default: 0 })
  year: number;

  @Prop({
    type: String,
    enum: ['scheduled', 'in_progress', 'graded', 'cancelled'],
    default: 'scheduled',
  })
  status: FinalTestStatus;

  @Prop({ trim: true, default: '' })
  meetLink: string;

  @Prop({ trim: true, default: '' })
  examLink: string;

  @Prop({ trim: true, default: '' })
  submissionLink: string;

  @Prop({ trim: true, default: '' })
  scoreOverall: string;

  @Prop({ trim: true, default: '' })
  scoreListening: string;

  @Prop({ trim: true, default: '' })
  scoreReading: string;

  @Prop({ trim: true, default: '' })
  scoreWriting: string;

  @Prop({ trim: true, default: '' })
  scoreSpeaking: string;

  @Prop({ trim: true, default: '' })
  feedback: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  bcbData: Record<string, unknown> | null;

  @Prop({ trim: true, default: '' })
  note: string;

  @Prop({ trim: true, default: '' })
  mockTestId: string;

  @Prop({ trim: true, default: '' })
  writingSubmissionId: string;

  @Prop({ type: Boolean, default: false })
  hasTakenTest: boolean;

  @Prop({ trim: true, default: '' })
  classification: string;

  @Prop({ trim: true, default: '' })
  submissionFolderLink: string;

  @Prop({ trim: true, default: '' })
  examFolderLink: string;

  @Prop({ trim: true, default: '' })
  bcbSpreadsheetLink: string;

  @Prop({ trim: true, default: '' })
  graderWTask1: string;

  @Prop({ trim: true, default: '' })
  graderWTask2: string;

  @Prop({ trim: true, default: '' })
  graderSpeaking: string;

  @Prop({ type: Boolean, default: false, index: true })
  isChecked: boolean;

  @Prop({ trim: true, default: 'Không đạt' })
  resultStatus: string;

  @Prop({ type: Boolean, default: false })
  isDone: boolean;

  @Prop({ trim: true, default: '' })
  releasedAt: string;

  @Prop({ trim: true, default: '' })
  releasedBy: string;
}

export const FinalTestSchema = SchemaFactory.createForClass(FinalTest);
FinalTestSchema.index({ candidateEmail: 1, date: -1 });
FinalTestSchema.index({ studentId: 1, createdAt: -1 });
