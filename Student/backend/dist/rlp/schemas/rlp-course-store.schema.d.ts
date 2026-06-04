import { HydratedDocument } from 'mongoose';
import type { RlpSessionRecord } from '../rlp.types';
export declare const RLP_COURSE_KEY = "main";
export type RlpCourseStoreDocument = HydratedDocument<RlpCourseStore>;
export declare class RlpCourseStore {
    key: string;
    sessions: RlpSessionRecord[];
}
export declare const RlpCourseStoreSchema: import("mongoose").Schema<RlpCourseStore, import("mongoose").Model<RlpCourseStore, any, any, any, any, any, RlpCourseStore>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RlpCourseStore, import("mongoose").Document<unknown, {}, RlpCourseStore, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<RlpCourseStore & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    key?: import("mongoose").SchemaDefinitionProperty<string, RlpCourseStore, import("mongoose").Document<unknown, {}, RlpCourseStore, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<RlpCourseStore & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sessions?: import("mongoose").SchemaDefinitionProperty<RlpSessionRecord[], RlpCourseStore, import("mongoose").Document<unknown, {}, RlpCourseStore, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<RlpCourseStore & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, RlpCourseStore>;
