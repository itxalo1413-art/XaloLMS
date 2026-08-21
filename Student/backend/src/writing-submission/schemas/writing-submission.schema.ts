import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { WRITING_SUBMISSION_STATUSES } from '../writing-submission.constants';

export type WritingSubmissionDocument = HydratedDocument<WritingSubmission>;

@Schema({ collection: 'writing_submissions', timestamps: true })
export class WritingSubmission {
  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  examLink: string;

  @Prop({ required: true })
  testDateTime: string;

  @Prop({ required: true, enum: WRITING_SUBMISSION_STATUSES, default: 'pending' })
  status: string;

  @Prop()
  score?: string;

  @Prop()
  gradedAt?: string;

  @Prop({ trim: true, default: '' })
  dueDate?: string;

  @Prop({ trim: true, default: '' })
  studentGmail?: string;

  @Prop({ trim: true, default: '' })
  type?: string;

  @Prop({ trim: true, default: '' })
  task1?: string;

  @Prop({ trim: true, default: '' })
  task2?: string;

  @Prop({ trim: true, default: '' })
  note?: string;

  @Prop({ trim: true, default: '' })
  assignedGrader?: string;

  @Prop({ trim: true, default: 'support' })
  source?: string;

  @Prop({ trim: true, default: '', index: true })
  entranceBookingId?: string;

  @Prop({ trim: true, default: '', index: true })
  finalTestId?: string;
}

export const WritingSubmissionSchema =
  SchemaFactory.createForClass(WritingSubmission);

WritingSubmissionSchema.index({ studentId: 1, createdAt: -1 });
WritingSubmissionSchema.index({ status: 1, createdAt: -1 });
