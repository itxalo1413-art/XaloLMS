export type PracticeSlotOverrideDto = {
  dayLabel?: string;
  time?: string;
  title?: string;
  detail?: string;
  dateNote?: string;
};

export class UpdatePracticeScheduleDto {
  weekRangeLabel?: string;
  slots?: Record<string, PracticeSlotOverrideDto>;
}
