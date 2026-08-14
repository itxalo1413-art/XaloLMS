import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CourseSettingsDocument = HydratedDocument<CourseSettings>;

export class CoursePhaseSchemaClass {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  date: string;
}

export class CourseImportantLinkSchemaClass {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true, default: '' })
  url: string;
}

@Schema({ timestamps: true })
export class CourseSettings {
  @Prop({ required: true, default: 'Momentum - 357 - C2' })
  course: string;

  @Prop({ required: true, default: 'Zoom Online' })
  room: string;

  @Prop({ required: true, default: 'Nghiêm Doãn Quỳnh Châu' })
  instructor: string;

  @Prop({ required: true, default: 'xalo2026' })
  zoomPassword: string;

  @Prop({ type: [String], default: ['T3: 19h45 - 21h45', 'T5: 19h45 - 21h45', 'T7: 19h45 - 21h45'] })
  schedule: string[];

  @Prop({ required: true, default: '21/04/2026' })
  openDate: string;

  @Prop({ required: true, default: '09/07/2026' })
  endDate: string;

  @Prop({ type: [CoursePhaseSchemaClass], default: [] })
  phases: CoursePhaseSchemaClass[];

  @Prop({ type: [CourseImportantLinkSchemaClass], default: [] })
  links: CourseImportantLinkSchemaClass[];
}

export const CourseSettingsSchema = SchemaFactory.createForClass(CourseSettings);
