import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EntranceTestType = 'speaking' | 'writing' | 'both';
export type EntranceTestFormat = 'online' | 'offline';
export type EntranceTestStatus =
  | 'scheduled'
  | 'in_progress'
  | 'graded'
  | 'cancelled';
export type EntranceTestBookingDocument = HydratedDocument<EntranceTestBooking>;

@Schema({ collection: 'entrance_test_bookings', timestamps: true })
export class EntranceTestBooking {
  @Prop({ required: true, trim: true })
  candidateName: string;

  @Prop({ trim: true, default: '' })
  candidatePhone: string;

  @Prop({ trim: true, default: '' })
  candidateEmail: string;

  @Prop({ trim: true, default: '' })
  leadId: string;

  @Prop({
    type: String,
    enum: ['speaking', 'writing', 'both'],
    default: 'speaking',
  })
  type: EntranceTestType;

  @Prop({
    type: String,
    enum: ['online', 'offline'],
    default: 'online',
  })
  format: EntranceTestFormat;

  @Prop({ trim: true, default: '' })
  graderName: string;

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

  @Prop({ trim: true, default: '' })
  meetLink: string;

  @Prop({ trim: true, default: '' })
  examLink: string;

  @Prop({ trim: true, default: '' })
  submissionLink: string;

  @Prop({ trim: true, default: '' })
  note: string;

  @Prop({
    type: String,
    enum: ['scheduled', 'in_progress', 'graded', 'cancelled'],
    default: 'scheduled',
  })
  status: EntranceTestStatus;

  @Prop({ trim: true, default: '' })
  scoreSpeaking: string;

  @Prop({ trim: true, default: '' })
  scoreWriting: string;

  @Prop({ trim: true, default: '' })
  feedback: string;

  @Prop({ trim: true, default: '' })
  slotId: string;

  @Prop({ trim: true, default: '' })
  mockTestId: string;

  @Prop({ trim: true, default: '' })
  writingSubmissionId: string;
}

export const EntranceTestBookingSchema =
  SchemaFactory.createForClass(EntranceTestBooking);
