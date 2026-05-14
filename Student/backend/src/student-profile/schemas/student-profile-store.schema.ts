import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StudentProfileStoreDocument = HydratedDocument<StudentProfileStore>;

/** Một bản ghi singleton (key cố định) cho API profile demo hiện tại. */
@Schema({ collection: 'student_profiles' })
export class StudentProfileStore {
  @Prop({ type: String, required: true, unique: true, default: 'default' })
  singletonKey: string;

  @Prop({ type: Object, required: true, default: {} })
  profileData: Record<string, unknown>;
}

export const StudentProfileStoreSchema =
  SchemaFactory.createForClass(StudentProfileStore);
