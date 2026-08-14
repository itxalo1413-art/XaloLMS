import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DailyNoteDocument = HydratedDocument<DailyNote>;

export class QuoteItemSchemaClass {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  word: string;

  @Prop({ required: true })
  meaning: string;

  @Prop()
  author?: string;

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ required: true })
  createdAt: string;
}

@Schema({ timestamps: true })
export class DailyNote {
  @Prop({ required: true, default: 'random' })
  mode: 'random' | 'pinned';

  @Prop({ required: true, default: 'Clouds.' })
  pinnedWord: string;

  @Prop({ required: true, default: "there's divinity in the clouds." })
  pinnedMeaning: string;

  @Prop({ type: [QuoteItemSchemaClass], default: [] })
  quotes: QuoteItemSchemaClass[];
}

export const DailyNoteSchema = SchemaFactory.createForClass(DailyNote);
