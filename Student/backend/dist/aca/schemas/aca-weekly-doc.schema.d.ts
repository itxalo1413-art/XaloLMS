import { HydratedDocument } from 'mongoose';
export type AcaWeeklyDocDocument = HydratedDocument<AcaWeeklyDoc>;
export declare class AcaWeeklyDoc {
    student: string;
    className: string;
    week: string;
    link: string;
    status: string;
}
export declare const AcaWeeklyDocSchema: import("mongoose").Schema<AcaWeeklyDoc, import("mongoose").Model<AcaWeeklyDoc, any, any, any, any, any, AcaWeeklyDoc>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AcaWeeklyDoc, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AcaWeeklyDoc & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    student?: import("mongoose").SchemaDefinitionProperty<string, AcaWeeklyDoc, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    className?: import("mongoose").SchemaDefinitionProperty<string, AcaWeeklyDoc, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    week?: import("mongoose").SchemaDefinitionProperty<string, AcaWeeklyDoc, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    link?: import("mongoose").SchemaDefinitionProperty<string, AcaWeeklyDoc, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, AcaWeeklyDoc, import("mongoose").Document<unknown, {}, AcaWeeklyDoc, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaWeeklyDoc & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AcaWeeklyDoc>;
