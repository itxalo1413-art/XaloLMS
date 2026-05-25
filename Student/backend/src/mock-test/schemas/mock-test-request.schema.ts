import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MOCK_TEST_STATUSES } from '../mock-test.constants';

export type MockTestRequestDocument = HydratedDocument<MockTestRequest>;

@Schema({ collection: 'mock_test_requests', timestamps: true })
export class MockTestRequest {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  skill: string;

  @Prop({ required: true, min: 1, max: 31 })
  day: number;

  @Prop({ required: true, min: 0, max: 11 })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, enum: MOCK_TEST_STATUSES, default: 'pending' })
  status: string;

  @Prop()
  examTime?: string;

  @Prop()
  examTeacher?: string;

  @Prop()
  score?: string;

  @Prop()
  examLink?: string;
}

export const MockTestRequestSchema =
  SchemaFactory.createForClass(MockTestRequest);

MockTestRequestSchema.index(
  { studentId: 1, skill: 1, day: 1, month: 1, year: 1, status: 1 },
  { name: 'student_slot_status' },
);
