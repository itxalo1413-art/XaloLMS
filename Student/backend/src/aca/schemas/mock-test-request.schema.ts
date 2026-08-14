import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MockTestRequestDocument = HydratedDocument<MockTestRequest>;

@Schema({ timestamps: true })
export class MockTestRequest {
  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  skill: string;

  @Prop({ required: true })
  day: number;

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  examTime: string;

  @Prop({ required: true, default: 'Chờ phân công' })
  status: string;

  @Prop()
  linkMeet?: string;

  @Prop()
  linkTab?: string;

  @Prop()
  note?: string;
}

export const MockTestRequestSchema = SchemaFactory.createForClass(MockTestRequest);
