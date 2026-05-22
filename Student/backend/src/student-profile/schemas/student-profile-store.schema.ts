import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StudentProfileStoreDocument = HydratedDocument<StudentProfileStore>;

@Schema({ collection: 'student_profiles', timestamps: true })
export class StudentProfileStore {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Object, required: true, default: {} })
  profileData: Record<string, unknown>;
}

export const StudentProfileStoreSchema =
  SchemaFactory.createForClass(StudentProfileStore);
