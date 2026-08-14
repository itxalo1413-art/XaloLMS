import { HydratedDocument, Types } from 'mongoose';
export type PracticeClassRegistrationDocument = HydratedDocument<PracticeClassRegistration>;
export declare class PracticeClassRegistration {
    userId: Types.ObjectId;
    slotId: string;
    linkFolder?: string;
    scoreR?: string;
    scoreL?: string;
    scoreW?: string;
}
export declare const PracticeClassRegistrationSchema: import("mongoose").Schema<PracticeClassRegistration, import("mongoose").Model<PracticeClassRegistration, any, any, any, any, any, PracticeClassRegistration>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PracticeClassRegistration, import("mongoose").Document<unknown, {}, PracticeClassRegistration, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassRegistration & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, PracticeClassRegistration, import("mongoose").Document<unknown, {}, PracticeClassRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassRegistration & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    slotId?: import("mongoose").SchemaDefinitionProperty<string, PracticeClassRegistration, import("mongoose").Document<unknown, {}, PracticeClassRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassRegistration & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkFolder?: import("mongoose").SchemaDefinitionProperty<string | undefined, PracticeClassRegistration, import("mongoose").Document<unknown, {}, PracticeClassRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassRegistration & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scoreR?: import("mongoose").SchemaDefinitionProperty<string | undefined, PracticeClassRegistration, import("mongoose").Document<unknown, {}, PracticeClassRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassRegistration & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scoreL?: import("mongoose").SchemaDefinitionProperty<string | undefined, PracticeClassRegistration, import("mongoose").Document<unknown, {}, PracticeClassRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassRegistration & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scoreW?: import("mongoose").SchemaDefinitionProperty<string | undefined, PracticeClassRegistration, import("mongoose").Document<unknown, {}, PracticeClassRegistration, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeClassRegistration & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PracticeClassRegistration>;
