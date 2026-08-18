import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GuestDiagnosisLeadStatus = 'new' | 'contacted' | 'converted' | 'closed';
export type GuestDiagnosisLeadDocument = HydratedDocument<GuestDiagnosisLead>;

@Schema({ collection: 'guest_diagnosis_leads', timestamps: true })
export class GuestDiagnosisLead {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ trim: true, default: '' })
  email: string;

  @Prop({ trim: true, default: '' })
  aim: string;

  @Prop({
    type: String,
    enum: ['new', 'contacted', 'converted', 'closed'],
    default: 'new',
  })
  status: GuestDiagnosisLeadStatus;

  @Prop({ trim: true, default: '' })
  note: string;

  @Prop({ trim: true, default: '' })
  assignedClassId: string;

  @Prop({ trim: true, default: '' })
  assignedClassName: string;
}

export const GuestDiagnosisLeadSchema =
  SchemaFactory.createForClass(GuestDiagnosisLead);
