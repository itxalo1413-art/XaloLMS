import { HydratedDocument } from 'mongoose';
export type TeacherAttendanceDocument = HydratedDocument<TeacherAttendance>;
export declare class TeacherAttendance {
    teacherEmail: string;
    sessionId: string;
    attended: boolean;
}
export declare const TeacherAttendanceSchema: import("mongoose").Schema<TeacherAttendance, import("mongoose").Model<TeacherAttendance, any, any, any, any, any, TeacherAttendance>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TeacherAttendance, import("mongoose").Document<unknown, {}, TeacherAttendance, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<TeacherAttendance & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    teacherEmail?: import("mongoose").SchemaDefinitionProperty<string, TeacherAttendance, import("mongoose").Document<unknown, {}, TeacherAttendance, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TeacherAttendance & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sessionId?: import("mongoose").SchemaDefinitionProperty<string, TeacherAttendance, import("mongoose").Document<unknown, {}, TeacherAttendance, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TeacherAttendance & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attended?: import("mongoose").SchemaDefinitionProperty<boolean, TeacherAttendance, import("mongoose").Document<unknown, {}, TeacherAttendance, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TeacherAttendance & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, TeacherAttendance>;
