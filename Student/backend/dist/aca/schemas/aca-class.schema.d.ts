import { HydratedDocument } from 'mongoose';
export type AcaClassDocument = HydratedDocument<AcaClass>;
export declare class AcaClass {
    classCode: string;
    name: string;
    month: number;
    type: string;
    openDate: string;
    teacher: string;
    currentPhase: string;
    phaseStartDate: string;
    phaseStudents: number;
    nextPhaseStartDate: string;
    nextPhase: string;
    slotsToEnroll: number;
    endDate: string;
    progressNote: string;
}
export declare const AcaClassSchema: import("mongoose").Schema<AcaClass, import("mongoose").Model<AcaClass, any, any, any, any, any, AcaClass>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    classCode?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    month?: import("mongoose").SchemaDefinitionProperty<number, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    openDate?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    teacher?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currentPhase?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phaseStartDate?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phaseStudents?: import("mongoose").SchemaDefinitionProperty<number, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nextPhaseStartDate?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nextPhase?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    slotsToEnroll?: import("mongoose").SchemaDefinitionProperty<number, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    progressNote?: import("mongoose").SchemaDefinitionProperty<string, AcaClass, import("mongoose").Document<unknown, {}, AcaClass, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaClass & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AcaClass>;
