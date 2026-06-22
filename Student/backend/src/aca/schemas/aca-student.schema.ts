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
  bcbLink: string;

  @Prop({ trim: true, default: '' })
  note: string;
}

export const AcaStudentSchema = SchemaFactory.createForClass(AcaStudent);
