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

  /**
   * Đợt RLP gắn với ngày khai giảng khóa (openDate).
   * Đổi openDate (khai giảng mới) → đổi rlpCohortKey → store RLP mới.
   * Chuyển chặng (đổi phaseStartDate) → giữ nguyên.
   */
  @Prop({ trim: true, default: '' })
  rlpCohortKey: string;

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

  /** Phòng học / Zoom room — theo từng lớp */
  @Prop({ trim: true, default: '' })
  room: string;

  /** Mật khẩu Zoom lớp */
  @Prop({ trim: true, default: '' })
  zoomPassword: string;

  /** Link Zoom họp lớp */
  @Prop({ trim: true, default: '' })
  zoomLink: string;

  /**
   * Lịch học dạng text (mỗi dòng một slot), ví dụ:
   * "Thứ 3: 19h45 - 21h30"
   */
  @Prop({ trim: true, default: '' })
  schedule: string;

  /** Link thư mục / tài nguyên theo lớp (RLP, bài giảng, bài tập, khảo sát…) */
  @Prop({
    type: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        value: { type: String, default: '' },
        url: { type: String, default: '' },
      },
    ],
    default: [],
  })
  links: { id: string; label: string; value: string; url: string }[];
}

export const AcaClassSchema = SchemaFactory.createForClass(AcaClass);
