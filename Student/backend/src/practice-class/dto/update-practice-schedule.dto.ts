export type PracticeSlotOverrideDto = {
  dayLabel?: string;
  time?: string;
  title?: string;
  detail?: string;
  dateNote?: string;
  materialsUrl?: string;
};

export class UpdatePracticeScheduleDto {
  weekRangeLabel?: string;
  zoomId?: string;
  zoomPassword?: string;
  slots?: Record<string, PracticeSlotOverrideDto>;
}
