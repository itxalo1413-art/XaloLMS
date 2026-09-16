export class RlpTemplateSessionItemDto {
  no: number;
  skill: string;
  contents: string;
  teacherNote?: string;
  lessonFileUrl?: string;
  homeworkFileUrl?: string;
  recordingUrl?: string;
}

export class CreateRlpTemplateDto {
  key: string;
  title: string;
  level: string;
  description?: string;
  totalSessions?: number;
  sessions?: RlpTemplateSessionItemDto[];
  isDefault?: boolean;
}

export class UpdateRlpTemplateDto {
  title?: string;
  level?: string;
  description?: string;
  totalSessions?: number;
  sessions?: RlpTemplateSessionItemDto[];
  isDefault?: boolean;
}

export class ApplyRlpTemplateDto {
  classId: string;

  /** Ngày bắt đầu / khai giảng tùy chọn nếu muốn tự tính lại lịch ngày. */
  startDate?: string;

  /**
   * Chế độ tính ngày:
   * - 'auto': Tự động tính ngày học theo thứ (246, 357, SS) từ startDate / openDate của lớp.
   * - 'keep_dates': Giữ nguyên ngày hiện tại của các buổi, chỉ cập nhật nội dung/kỹ năng/tài liệu.
   */
  scheduleMode?: 'auto' | 'keep_dates';

  /** Ghi đè toàn bộ buổi học của lớp hay giữ lại số buổi cũ. */
  overwriteExisting?: boolean;
}

/** Áp dụng RLP từ một lớp ACA thật (source) sang lớp đích. */
export class ApplyClassRlpDto {
  /** classId lớp đích nhận RLP */
  classId: string;
  startDate?: string;
  scheduleMode?: 'auto' | 'keep_dates';
  overwriteExisting?: boolean;
}
