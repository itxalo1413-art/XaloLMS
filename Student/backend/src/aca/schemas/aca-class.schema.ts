import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaClassDocument = HydratedDocument<AcaClass>;

@Schema({ collection: 'aca_classes', timestamps: true })
export class AcaClass {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  month: number; // 5 or 6

  @Prop({ required: true, trim: true })
  type: string; // e.g. "Lớp đang diễn ra", "Lớp mới"

  @Prop({ trim: true, default: '' })
  openDate: string;

  @Prop({ trim: true, default: '' })
  teacher: string;

  @Prop({ trim: true, default: '' })
  currentPhase: string;

  @Prop({ trim: true, default: '' })
  phaseStartDate: string;

  @Prop({ default: 0 })
  phaseStudents: number;

  @Prop({ trim: true, default: '' })
  nextPhaseStartDate: string;

  @Prop({ trim: true, default: '' })
  nextPhase: string;

  @Prop({ default: 0 })
  slotsToEnroll: number;
}

export const AcaClassSchema = SchemaFactory.createForClass(AcaClass);
