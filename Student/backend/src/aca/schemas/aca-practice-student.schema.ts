import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaPracticeStudentDocument = HydratedDocument<AcaPracticeStudent>;

@Schema({ collection: 'aca_practice_students', timestamps: true })
export class AcaPracticeStudent {
  @Prop({ required: true })
  stt: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ trim: true, default: '' })
  rlp: string;

  @Prop({ trim: true, default: '' })
  testScheduleSunday: string;

  @Prop({ trim: true, default: '' })
  scheduleTueSat: string;

  @Prop({ default: false })
  participateLd28: boolean;

  @Prop({ trim: true, default: '' })
  note: string;

  @Prop({ required: true, trim: true })
  weekRange: string; // e.g. "08/06/2026 - 14/06/2026"
}

export const AcaPracticeStudentSchema = SchemaFactory.createForClass(AcaPracticeStudent);
