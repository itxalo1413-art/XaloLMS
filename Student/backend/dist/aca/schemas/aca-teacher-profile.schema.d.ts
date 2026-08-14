import { HydratedDocument } from 'mongoose';
export type AcaTeacherProfileDocument = HydratedDocument<AcaTeacherProfile>;
export declare class AcaTeacherProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    skills: string[];
    status: 'active' | 'inactive';
    joinDate: string;
    notes: string;
}
export declare const AcaTeacherProfileSchema: import("mongoose").Schema<AcaTeacherProfile, import("mongoose").Model<AcaTeacherProfile, any, any, any, any, any, AcaTeacherProfile>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, {
    id?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    skills?: import("mongoose").SchemaDefinitionProperty<string[], AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"active" | "inactive", AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    joinDate?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    notes?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherProfile, import("mongoose").Document<unknown, {}, AcaTeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & AcaTeacherProfile & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
}, AcaTeacherProfile>;
