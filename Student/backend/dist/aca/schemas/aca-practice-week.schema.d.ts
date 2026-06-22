import { HydratedDocument } from 'mongoose';
export type AcaPracticeWeekDocument = HydratedDocument<AcaPracticeWeek>;
export declare class AcaPracticeWeek {
    weekRange: string;
    linkMeet: string;
    linkTab: string;
    announcement: string;
    templateMessage: string;
}
export declare const AcaPracticeWeekSchema: import("mongoose").Schema<AcaPracticeWeek, import("mongoose").Model<AcaPracticeWeek, any, any, any, any, any, AcaPracticeWeek>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AcaPracticeWeek, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeWeek & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    weekRange?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeWeek, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkMeet?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeWeek, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkTab?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeWeek, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    announcement?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeWeek, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    templateMessage?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeWeek, import("mongoose").Document<unknown, {}, AcaPracticeWeek, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeWeek & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AcaPracticeWeek>;
