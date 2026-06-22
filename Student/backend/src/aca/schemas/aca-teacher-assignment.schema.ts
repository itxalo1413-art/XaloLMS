import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaTeacherAssignmentDocument = HydratedDocument<AcaTeacherAssignment>;

@Schema({ collection: 'aca_teacher_assignments', timestamps: true })
export class AcaTeacherAssignment {
  @Prop({ required: true, trim: true })
  teacher: string;

  @Prop({ required: true, trim: true })
  className: string;

  @Prop({ required: true, trim: true })
  assignedLevel: string; // e.g. "IELTS 5.5", "IELTS 6.0", etc.
}

export const AcaTeacherAssignmentSchema = SchemaFactory.createForClass(AcaTeacherAssignment);
