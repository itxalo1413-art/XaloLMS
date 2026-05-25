import { HydratedDocument, Types } from 'mongoose';
export type PracticeClassRegistrationDocument = HydratedDocument<PracticeClassRegistration>;
export declare class PracticeClassRegistration {
    userId: Types.ObjectId;
    slotId: string;
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
}, PracticeClassRegistration>;
