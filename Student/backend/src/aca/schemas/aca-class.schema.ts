import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AcaClassDocument = HydratedDocument<AcaClass>;

@Schema({ collection: 'aca_classes', timestamps: true })
export class AcaClass {
  /**
   * Mã lớp ngắn, dễ đọc, ví dụ: UPSTR-246-C2-KHOA-5
   * Format: {PROG}-{DAYS}-{SLOT}-{TEACHER}-{MONTH}
   * Không bắt buộc để backward-compatible với dữ liệu cũ.
   */
  @Prop({ trim: true, default: '' })
  classCode: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  month: number; // 5 or 6

  @Prop({ required: true, trim: true })
  type: string; // e.g. "Lớp đang diễn ra", "Lớp mới"

  @Prop({ trim: true, default: '' })
  openDate: string;

  @Prop({ trim: true, default: '' })
  teacher: string;

  @Prop({ trim: true, default: '' })
  currentPhase: string;

  @Prop({ trim: true, default: '' })
  phaseStartDate: string;

  @Prop({ default: 0 })
  phaseStudents: number;

  @Prop({ trim: true, default: '' })
  nextPhaseStartDate: string;

  @Prop({ trim: true, default: '' })
  nextPhase: string;

  @Prop({ default: 0 })
  slotsToEnroll: number;

  /** Ngày kết thúc lớp học (dd/mm/yyyy) */
  @Prop({ trim: true, default: '' })
  endDate: string;

  /** Ghi chú tình trạng tiến độ lớp */
  @Prop({ trim: true, default: '' })
  progressNote: string;

  /** Số ngày thời lượng chặng để chiếu lịch custom */
  @Prop({ type: Number })
  phaseDurationDays?: number;
}

export const AcaClassSchema = SchemaFactory.createForClass(AcaClass);
