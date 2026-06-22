import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type Aca11ClassDocument = HydratedDocument<Aca11Class>;

@Schema({ collection: 'aca_11_classes', timestamps: true })
export class Aca11Class {
  @Prop({ required: true, trim: true })
  status: 'Đang diễn ra' | 'Bảo lưu' | 'Đã kết thúc';

  @Prop({ required: true, trim: true })
  className: string;

  @Prop({ trim: true, default: '' })
  inputNeed: string;

  @Prop({ trim: true, default: '' })
  teacher: string;

  @Prop({ trim: true, default: '' })
  schedule: string;

  @Prop({ trim: true, default: '' })
  startDate: string;

  @Prop({ trim: true, default: '' })
  endDate: string;

  @Prop({ trim: true, default: '' })
  progress: string;

  @Prop({ trim: true, default: '' })
  output: string;

  @Prop({ trim: true, default: '' })
  otherNote: string;

  @Prop({ trim: true, default: '' })
  zoomLink: string;

  @Prop({ trim: true, default: '' })
  successorLink: string;

  @Prop({ trim: true, default: '' })
  materials: string;
}

export const Aca11ClassSchema = SchemaFactory.createForClass(Aca11Class);
