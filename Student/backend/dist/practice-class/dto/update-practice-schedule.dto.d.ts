export type PracticeSlotOverrideDto = {
    dayLabel?: string;
    time?: string;
    title?: string;
    detail?: string;
    dateNote?: string;
};
export declare class UpdatePracticeScheduleDto {
    weekRangeLabel?: string;
    slots?: Record<string, PracticeSlotOverrideDto>;
}
