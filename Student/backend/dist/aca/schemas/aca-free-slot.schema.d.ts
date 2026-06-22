import { HydratedDocument } from 'mongoose';
export type AcaFreeSlotDocument = HydratedDocument<AcaFreeSlot>;
export declare class AcaFreeSlot {
    day: number;
    month: number;
    year: number;
    time: string;
    teacherName: string;
    status: string;
    type: string;
}
export declare const AcaFreeSlotSchema: import("mongoose").Schema<AcaFreeSlot, import("mongoose").Model<AcaFreeSlot, any, any, any, any, any, AcaFreeSlot>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AcaFreeSlot, import("mongoose").Document<unknown, {}, AcaFreeSlot, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AcaFreeSlot & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    day?: import("mongoose").SchemaDefinitionProperty<number, AcaFreeSlot, import("mongoose").Document<unknown, {}, AcaFreeSlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    month?: import("mongoose").SchemaDefinitionProperty<number, AcaFreeSlot, import("mongoose").Document<unknown, {}, AcaFreeSlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    year?: import("mongoose").SchemaDefinitionProperty<number, AcaFreeSlot, import("mongoose").Document<unknown, {}, AcaFreeSlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    time?: import("mongoose").SchemaDefinitionProperty<string, AcaFreeSlot, import("mongoose").Document<unknown, {}, AcaFreeSlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    teacherName?: import("mongoose").SchemaDefinitionProperty<string, AcaFreeSlot, import("mongoose").Document<unknown, {}, AcaFreeSlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, AcaFreeSlot, import("mongoose").Document<unknown, {}, AcaFreeSlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, AcaFreeSlot, import("mongoose").Document<unknown, {}, AcaFreeSlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaFreeSlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AcaFreeSlot>;
