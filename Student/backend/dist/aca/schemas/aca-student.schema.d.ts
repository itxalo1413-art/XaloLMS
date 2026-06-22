import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
export type AcaStudentDocument = HydratedDocument<AcaStudent>;
declare class AcaStudentScores {
    l: string | number;
    r: string | number;
    w: string | number;
    s: string | number;
    o: string | number;
}
export declare class AcaStudent {
    classId: string;
    stt: number;
    name: string;
    phone: string;
    email: string;
    classification: string;
    scores: AcaStudentScores;
    finalScores: AcaStudentScores;
    bcbLink: string;
    note: string;
}
export declare const AcaStudentSchema: MongooseSchema<AcaStudent, import("mongoose").Model<AcaStudent, any, any, any, any, any, AcaStudent>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    classId?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    stt?: import("mongoose").SchemaDefinitionProperty<number, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    classification?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scores?: import("mongoose").SchemaDefinitionProperty<AcaStudentScores, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    finalScores?: import("mongoose").SchemaDefinitionProperty<AcaStudentScores, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    bcbLink?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    note?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AcaStudent>;
export {};
