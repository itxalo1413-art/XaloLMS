import { HydratedDocument } from 'mongoose';
export type WritingSubmissionDocument = HydratedDocument<WritingSubmission>;
export declare class WritingSubmission {
    studentId: string;
    studentName: string;
    examLink: string;
    testDateTime: string;
    status: string;
    score?: string;
    gradedAt?: string;
}
export declare const WritingSubmissionSchema: import("mongoose").Schema<WritingSubmission, import("mongoose").Model<WritingSubmission, any, any, any, any, any, WritingSubmission>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WritingSubmission, import("mongoose").Document<unknown, {}, WritingSubmission, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<WritingSubmission & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    studentId?: import("mongoose").SchemaDefinitionProperty<string, WritingSubmission, import("mongoose").Document<unknown, {}, WritingSubmission, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WritingSubmission & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    studentName?: import("mongoose").SchemaDefinitionProperty<string, WritingSubmission, import("mongoose").Document<unknown, {}, WritingSubmission, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WritingSubmission & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    examLink?: import("mongoose").SchemaDefinitionProperty<string, WritingSubmission, import("mongoose").Document<unknown, {}, WritingSubmission, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WritingSubmission & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    testDateTime?: import("mongoose").SchemaDefinitionProperty<string, WritingSubmission, import("mongoose").Document<unknown, {}, WritingSubmission, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WritingSubmission & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, WritingSubmission, import("mongoose").Document<unknown, {}, WritingSubmission, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WritingSubmission & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    score?: import("mongoose").SchemaDefinitionProperty<string | undefined, WritingSubmission, import("mongoose").Document<unknown, {}, WritingSubmission, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WritingSubmission & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    gradedAt?: import("mongoose").SchemaDefinitionProperty<string | undefined, WritingSubmission, import("mongoose").Document<unknown, {}, WritingSubmission, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WritingSubmission & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, WritingSubmission>;
