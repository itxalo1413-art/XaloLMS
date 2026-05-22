import { HydratedDocument, Types } from 'mongoose';
export type StudentProfileStoreDocument = HydratedDocument<StudentProfileStore>;
export declare class StudentProfileStore {
    userId: Types.ObjectId;
    profileData: Record<string, unknown>;
}
export declare const StudentProfileStoreSchema: import("mongoose").Schema<StudentProfileStore, import("mongoose").Model<StudentProfileStore, any, any, any, any, any, StudentProfileStore>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StudentProfileStore, import("mongoose").Document<unknown, {}, StudentProfileStore, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<StudentProfileStore & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, StudentProfileStore, import("mongoose").Document<unknown, {}, StudentProfileStore, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StudentProfileStore & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    profileData?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, StudentProfileStore, import("mongoose").Document<unknown, {}, StudentProfileStore, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StudentProfileStore & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, StudentProfileStore>;
