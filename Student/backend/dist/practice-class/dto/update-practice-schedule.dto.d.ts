export type PracticeSlotOverrideDto = {
    dayLabel?: string;
    time?: string;
    dateNote?: string;
};
export declare class UpdatePracticeScheduleDto {
    weekRangeLabel?: string;
    slots?: Record<string, PracticeSlotOverrideDto>;
}
