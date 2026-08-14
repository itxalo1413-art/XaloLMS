import { HydratedDocument } from 'mongoose';
export type DailyNoteDocument = HydratedDocument<DailyNote>;
export declare class QuoteItemSchemaClass {
    id: string;
    word: string;
    meaning: string;
    author?: string;
    active: boolean;
    createdAt: string;
}
export declare class DailyNote {
    mode: 'random' | 'pinned';
    pinnedWord: string;
    pinnedMeaning: string;
    quotes: QuoteItemSchemaClass[];
}
export declare const DailyNoteSchema: import("mongoose").Schema<DailyNote, import("mongoose").Model<DailyNote, any, any, any, any, any, DailyNote>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DailyNote, import("mongoose").Document<unknown, {}, DailyNote, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<DailyNote & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    mode?: import("mongoose").SchemaDefinitionProperty<"random" | "pinned", DailyNote, import("mongoose").Document<unknown, {}, DailyNote, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pinnedWord?: import("mongoose").SchemaDefinitionProperty<string, DailyNote, import("mongoose").Document<unknown, {}, DailyNote, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pinnedMeaning?: import("mongoose").SchemaDefinitionProperty<string, DailyNote, import("mongoose").Document<unknown, {}, DailyNote, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    quotes?: import("mongoose").SchemaDefinitionProperty<QuoteItemSchemaClass[], DailyNote, import("mongoose").Document<unknown, {}, DailyNote, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DailyNote & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, DailyNote>;
