import { HydratedDocument } from 'mongoose';
import type { RlpSessionRecord } from '../../rlp/rlp.types';
export type PracticeRlpStoreDocument = HydratedDocument<PracticeRlpStore>;
export declare class PracticeRlpStore {
    studentId: string;
    sessions: RlpSessionRecord[];
}
export declare const PracticeRlpStoreSchema: import("mongoose").Schema<PracticeRlpStore, import("mongoose").Model<PracticeRlpStore, any, any, any, any, any, PracticeRlpStore>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PracticeRlpStore, import("mongoose").Document<unknown, {}, PracticeRlpStore, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PracticeRlpStore & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    studentId?: import("mongoose").SchemaDefinitionProperty<string, PracticeRlpStore, import("mongoose").Document<unknown, {}, PracticeRlpStore, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeRlpStore & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sessions?: import("mongoose").SchemaDefinitionProperty<RlpSessionRecord[], PracticeRlpStore, import("mongoose").Document<unknown, {}, PracticeRlpStore, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PracticeRlpStore & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PracticeRlpStore>;
