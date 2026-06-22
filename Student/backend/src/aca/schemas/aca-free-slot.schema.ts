import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaFreeSlotDocument = HydratedDocument<AcaFreeSlot>;

@Schema({ collection: 'aca_free_slots', timestamps: true })
export class AcaFreeSlot {
  @Prop({ required: true })
  day: number;

  @Prop({ required: true })
  month: number; // 0-indexed (0 = Jan) to align with JavaScript Date / frontend state

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, trim: true })
  time: string; // e.g. "09:00", "14:30"

  @Prop({ trim: true, default: '' })
  teacherName: string; // e.g. "Ms. Hoa"

  @Prop({ trim: true, default: 'available' })
  status: string; // e.g. "available", "booked"

  @Prop({ trim: true, default: 'Nhận ca Test speaking/ chấm writing online' })
  type: string; // e.g. "Nhận ca Test speaking/ chấm writing online", "Nhận ca Test speaking/ chấm writing offline", etc.
}

export const AcaFreeSlotSchema = SchemaFactory.createForClass(AcaFreeSlot);
