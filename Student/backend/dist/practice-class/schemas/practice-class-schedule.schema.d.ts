import { HydratedDocument } from 'mongoose';
import type { PracticeSlotOverride } from '../practice-class.constants';
export type PracticeClassScheduleDocument = HydratedDocument<PracticeClassSchedule>;
export declare class PracticeClassSchedule {
    key: string;
    weekRangeLabel: string;
    slotOverrides: Record<string, PracticeSlotOverride>;
}
export declare const PracticeClassScheduleSchema: import("mongoose").Schema<PracticeClassSchedule, import("mongoose").Model<PracticeClassSchedule, any, any, any, any, any, PracticeClassSchedule>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PracticeClassSchedule, import("mongoose").Document<unknown, {}, PracticeClassSchedule, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassSchedule & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    key?: import("mongoose").SchemaDefinitionProperty<string, PracticeClassSchedule, import("mongoose").Document<unknown, {}, PracticeClassSchedule, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassSchedule & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    weekRangeLabel?: import("mongoose").SchemaDefinitionProperty<string, PracticeClassSchedule, import("mongoose").Document<unknown, {}, PracticeClassSchedule, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassSchedule & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    slotOverrides?: import("mongoose").SchemaDefinitionProperty<Record<string, PracticeSlotOverride>, PracticeClassSchedule, import("mongoose").Document<unknown, {}, PracticeClassSchedule, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassSchedule & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PracticeClassSchedule>;
