import { HydratedDocument, Types } from 'mongoose';
export type MockTestRequestDocument = HydratedDocument<MockTestRequest>;
export declare class MockTestRequest {
    studentId: Types.ObjectId;
    studentName: string;
    skill: string;
    day: number;
    month: number;
    year: number;
    status: string;
    examTime?: string;
    examTeacher?: string;
    score?: string;
    examLink?: string;
}
export declare const MockTestRequestSchema: import("mongoose").Schema<MockTestRequest, import("mongoose").Model<MockTestRequest, any, any, any, any, any, MockTestRequest>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    studentId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    studentName?: import("mongoose").SchemaDefinitionProperty<string, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    skill?: import("mongoose").SchemaDefinitionProperty<string, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    day?: import("mongoose").SchemaDefinitionProperty<number, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    month?: import("mongoose").SchemaDefinitionProperty<number, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    year?: import("mongoose").SchemaDefinitionProperty<number, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    examTime?: import("mongoose").SchemaDefinitionProperty<string | undefined, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    examTeacher?: import("mongoose").SchemaDefinitionProperty<string | undefined, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    score?: import("mongoose").SchemaDefinitionProperty<string | undefined, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    examLink?: import("mongoose").SchemaDefinitionProperty<string | undefined, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, MockTestRequest>;
