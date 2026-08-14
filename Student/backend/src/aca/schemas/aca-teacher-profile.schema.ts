import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaTeacherProfileDocument = HydratedDocument<AcaTeacherProfile>;

@Schema({ collection: 'aca_teacher_profiles', timestamps: true })
export class AcaTeacherProfile {
  @Prop({ required: true, unique: true, trim: true })
  id: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: false, trim: true, default: '' })
  phone: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';

  @Prop({ required: false, trim: true, default: '' })
  joinDate: string;

  @Prop({ required: false, trim: true, default: '' })
  notes: string;
}

export const AcaTeacherProfileSchema = SchemaFactory.createForClass(AcaTeacherProfile);
