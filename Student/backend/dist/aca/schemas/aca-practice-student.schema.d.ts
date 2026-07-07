import { HydratedDocument } from 'mongoose';
export type AcaPracticeStudentDocument = HydratedDocument<AcaPracticeStudent>;
export declare class AcaPracticeStudent {
    stt: number;
    name: string;
    phone: string;
    rlp: string;
    testScheduleSunday: string;
    scheduleTueSat: string;
    scheduleTue: string;
    scheduleSat: string;
    scheduleSun: string;
    participateLd28: boolean;
    note: string;
    weekRange: string;
}
export declare const AcaPracticeStudentSchema: import("mongoose").Schema<AcaPracticeStudent, import("mongoose").Model<AcaPracticeStudent, any, any, any, any, any, AcaPracticeStudent>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    stt?: import("mongoose").SchemaDefinitionProperty<number, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rlp?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    testScheduleSunday?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduleTueSat?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduleTue?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduleSat?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduleSun?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    participateLd28?: import("mongoose").SchemaDefinitionProperty<boolean, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    note?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    weekRange?: import("mongoose").SchemaDefinitionProperty<string, AcaPracticeStudent, import("mongoose").Document<unknown, {}, AcaPracticeStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaPracticeStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AcaPracticeStudent>;
