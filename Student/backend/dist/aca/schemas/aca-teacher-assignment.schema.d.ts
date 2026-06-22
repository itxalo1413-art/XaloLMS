import { HydratedDocument } from 'mongoose';
export type AcaTeacherAssignmentDocument = HydratedDocument<AcaTeacherAssignment>;
export declare class AcaTeacherAssignment {
    teacher: string;
    className: string;
    assignedLevel: string;
}
export declare const AcaTeacherAssignmentSchema: import("mongoose").Schema<AcaTeacherAssignment, import("mongoose").Model<AcaTeacherAssignment, any, any, any, any, any, AcaTeacherAssignment>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AcaTeacherAssignment, import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AcaTeacherAssignment & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    teacher?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherAssignment, import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    className?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherAssignment, import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    assignedLevel?: import("mongoose").SchemaDefinitionProperty<string, AcaTeacherAssignment, import("mongoose").Document<unknown, {}, AcaTeacherAssignment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaTeacherAssignment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AcaTeacherAssignment>;
