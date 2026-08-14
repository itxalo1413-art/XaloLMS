export declare const PRACTICE_SCHEDULE_KEY = "current";
export declare const PRACTICE_SLOT_IDS: readonly ["sun-lrw", "tue-lrw", "sat-speaking"];
export type PracticeSlotId = (typeof PRACTICE_SLOT_IDS)[number];
export type PracticeSlotOverride = {
    dayLabel: string;
    time: string;
    title?: string;
    detail?: string;
    dateNote?: string;
};
export type PracticeSlotDefinition = {
    id: PracticeSlotId;
    dayOfWeek: number;
    dayLabel: string;
    time: string;
    title: string;
    detail: string;
    platform: string;
};
export declare const PRACTICE_SLOT_DEFINITIONS: PracticeSlotDefinition[];
export declare function isPracticeSlotId(value: string): value is PracticeSlotId;
