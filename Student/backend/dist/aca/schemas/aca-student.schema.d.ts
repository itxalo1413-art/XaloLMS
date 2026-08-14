import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
export type AcaStudentDocument = HydratedDocument<AcaStudent>;
declare class AcaStudentScores {
    l: string | number;
    r: string | number;
    w: string | number;
    s: string | number;
    o: string | number;
}
declare class AcaStudentCycle {
    classCode: string;
    finalScore: string;
    registeredWriting: boolean;
    registeredMocktest: boolean;
    registeredLuyenDe: boolean;
    homeworkPercent: string;
    attendanceCount: string;
    scores: AcaStudentScores;
    finalScores: AcaStudentScores;
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
    entrance: string;
    registeredWriting: boolean;
    registeredMocktest: boolean;
    registeredLuyenDe: boolean;
    homeworkPercent: string;
    attendanceCount: string;
    registeredWriting2: boolean;
    registeredMocktest2: boolean;
    registeredLuyenDe2: boolean;
    homeworkPercent2: string;
    attendanceCount2: string;
    registeredWriting3: boolean;
    registeredMocktest3: boolean;
    registeredLuyenDe3: boolean;
    homeworkPercent3: string;
    attendanceCount3: string;
    l1: string;
    f1: string;
    l2: string;
    f2: string;
    l3: string;
    f3: string;
    bcbLink: string;
    note: string;
    rawClassification: string;
    cycles: AcaStudentCycle[];
    dob: string;
    zodiac: string;
    avatarUrl: string;
    method: string;
    weeklyHours: string;
    classEnvironment: string;
    ieltsMeaning: string;
    previousBand: string;
    focusSkills: string[];
    practiceJoined: boolean;
    registeredSlotIds: string[];
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
    entrance?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredWriting?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredMocktest?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredLuyenDe?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    homeworkPercent?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attendanceCount?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredWriting2?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredMocktest2?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredLuyenDe2?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    homeworkPercent2?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attendanceCount2?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredWriting3?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredMocktest3?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredLuyenDe3?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    homeworkPercent3?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    attendanceCount3?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    l1?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    f1?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    l2?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    f2?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    l3?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    f3?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
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
    rawClassification?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cycles?: import("mongoose").SchemaDefinitionProperty<AcaStudentCycle[], AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    dob?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    zodiac?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    avatarUrl?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    method?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    weeklyHours?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    classEnvironment?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ieltsMeaning?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    previousBand?: import("mongoose").SchemaDefinitionProperty<string, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    focusSkills?: import("mongoose").SchemaDefinitionProperty<string[], AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    practiceJoined?: import("mongoose").SchemaDefinitionProperty<boolean, AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AcaStudent & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredSlotIds?: import("mongoose").SchemaDefinitionProperty<string[], AcaStudent, import("mongoose").Document<unknown, {}, AcaStudent, {
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
