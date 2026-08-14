import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TeacherAttendanceDocument = HydratedDocument<TeacherAttendance>;

@Schema({ collection: 'teacher_attendances', timestamps: true })
export class TeacherAttendance {
  @Prop({ required: true, trim: true, lowercase: true })
  teacherEmail: string;

  @Prop({ required: true, trim: true })
  sessionId: string;

  @Prop({ required: true, default: false })
  attended: boolean;
}

export const TeacherAttendanceSchema = SchemaFactory.createForClass(TeacherAttendance);
