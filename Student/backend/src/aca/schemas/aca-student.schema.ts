import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AcaStudentDocument = HydratedDocument<AcaStudent>;

@Schema()
class AcaStudentScores {
  @Prop({ type: MongooseSchema.Types.Mixed, default: '-' })
  l: string | number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: '-' })
  r: string | number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: '-' })
  w: string | number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: '-' })
  s: string | number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: '-' })
  o: string | number;
}

const AcaStudentScoresSchema = SchemaFactory.createForClass(AcaStudentScores);

@Schema()
class AcaStudentCycle {
  @Prop({ trim: true, default: '' })
  classCode: string;

  @Prop({ trim: true, default: '' })
  finalScore: string;

  @Prop({ type: Boolean, default: false })
  registeredWriting: boolean;

  @Prop({ type: Boolean, default: false })
  registeredMocktest: boolean;

  @Prop({ type: Boolean, default: false })
  registeredLuyenDe: boolean;

  @Prop({ trim: true, default: '' })
  homeworkPercent: string;

  @Prop({ trim: true, default: '' })
  attendanceCount: string;

  @Prop({ type: AcaStudentScoresSchema, default: () => ({ l: '-', r: '-', w: '-', s: '-', o: '-' }) })
  scores: AcaStudentScores;

  @Prop({ type: AcaStudentScoresSchema, default: () => ({ l: '-', r: '-', w: '-', s: '-', o: '-' }) })
  finalScores: AcaStudentScores;
}

const AcaStudentCycleSchema = SchemaFactory.createForClass(AcaStudentCycle);

@Schema({ collection: 'aca_students', timestamps: true })
export class AcaStudent {
  @Prop({ required: true, trim: true })
  classId: string;

  @Prop({ required: true })
  stt: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ trim: true, default: '' })
  email: string;

  @Prop({ trim: true, default: '' })
  classification: string;

  @Prop({ type: AcaStudentScoresSchema, default: () => ({}) })
  scores: AcaStudentScores;

  @Prop({ type: AcaStudentScoresSchema, default: () => ({ l: '-', r: '-', w: '-', s: '-', o: '-' }) })
  finalScores: AcaStudentScores;

  @Prop({ trim: true, default: '' })
  entrance: string;

  @Prop({ type: Boolean, default: false })
  registeredWriting: boolean;

  @Prop({ type: Boolean, default: false })
  registeredMocktest: boolean;

  @Prop({ type: Boolean, default: false })
  registeredLuyenDe: boolean;

  @Prop({ trim: true, default: '' })
  homeworkPercent: string;

  @Prop({ trim: true, default: '' })
  attendanceCount: string;

  @Prop({ type: Boolean, default: false })
  registeredWriting2: boolean;

  @Prop({ type: Boolean, default: false })
  registeredMocktest2: boolean;

  @Prop({ type: Boolean, default: false })
  registeredLuyenDe2: boolean;

  @Prop({ trim: true, default: '' })
  homeworkPercent2: string;

  @Prop({ trim: true, default: '' })
  attendanceCount2: string;

  @Prop({ type: Boolean, default: false })
  registeredWriting3: boolean;

  @Prop({ type: Boolean, default: false })
  registeredMocktest3: boolean;

  @Prop({ type: Boolean, default: false })
  registeredLuyenDe3: boolean;

  @Prop({ trim: true, default: '' })
  homeworkPercent3: string;

  @Prop({ trim: true, default: '' })
  attendanceCount3: string;

  @Prop({ trim: true, default: '' })
  l1: string;

  @Prop({ trim: true, default: '' })
  f1: string;

  @Prop({ trim: true, default: '' })
  l2: string;

  @Prop({ trim: true, default: '' })
  f2: string;

  @Prop({ trim: true, default: '' })
  l3: string;

  @Prop({ trim: true, default: '' })
  f3: string;

  @Prop({ trim: true, default: '' })
  bcbLink: string;

  @Prop({ trim: true, default: '' })
  note: string;

  @Prop({ type: [AcaStudentCycleSchema], default: () => [] })
  cycles: AcaStudentCycle[];
}

export const AcaStudentSchema = SchemaFactory.createForClass(AcaStudent);
