import { HydratedDocument } from 'mongoose';
export type MockTestRequestDocument = HydratedDocument<MockTestRequest>;
export declare class MockTestRequest {
    studentId: string;
    studentName: string;
    skill: string;
    day: number;
    month: number;
    year: number;
    examTime: string;
    status: string;
    linkMeet?: string;
    linkTab?: string;
    note?: string;
}
export declare const MockTestRequestSchema: import("mongoose").Schema<MockTestRequest, import("mongoose").Model<MockTestRequest, any, any, any, any, any, MockTestRequest>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    studentId?: import("mongoose").SchemaDefinitionProperty<string, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    studentName?: import("mongoose").SchemaDefinitionProperty<string, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    skill?: import("mongoose").SchemaDefinitionProperty<string, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    day?: import("mongoose").SchemaDefinitionProperty<number, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    month?: import("mongoose").SchemaDefinitionProperty<number, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    year?: import("mongoose").SchemaDefinitionProperty<number, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    examTime?: import("mongoose").SchemaDefinitionProperty<string, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkMeet?: import("mongoose").SchemaDefinitionProperty<string | undefined, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkTab?: import("mongoose").SchemaDefinitionProperty<string | undefined, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    note?: import("mongoose").SchemaDefinitionProperty<string | undefined, MockTestRequest, import("mongoose").Document<unknown, {}, MockTestRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MockTestRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, MockTestRequest>;
