import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AcaKvStoreDocument = HydratedDocument<AcaKvStore>;

/**
 * General-purpose key-value store cho ACA.
 * Mỗi document là 1 namespace (key), value là JSON object tự do.
 * Ví dụ: { namespace: 'graderMeetLinks', data: { "Khánh Thi": "https://..." } }
 */
@Schema({ collection: 'aca_kv_store', timestamps: true })
export class AcaKvStore {
  @Prop({ required: true, unique: true, trim: true, index: true })
  namespace: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  data: Record<string, unknown>;
}

export const AcaKvStoreSchema = SchemaFactory.createForClass(AcaKvStore);
