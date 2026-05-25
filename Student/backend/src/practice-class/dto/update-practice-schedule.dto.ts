export type PracticeSlotOverrideDto = {
  dayLabel?: string;
  time?: string;
  dateNote?: string;
};

export class UpdatePracticeScheduleDto {
  weekRangeLabel?: string;
  slots?: Record<string, PracticeSlotOverrideDto>;
}
