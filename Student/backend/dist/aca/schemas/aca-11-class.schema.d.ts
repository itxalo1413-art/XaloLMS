import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
export type Aca11ClassDocument = HydratedDocument<Aca11Class>;
export declare class Aca11Class {
    status: 'Đang diễn ra' | 'Bảo lưu' | 'Đã kết thúc';
    className: string;
    inputNeed: string;
    teacher: string;
    schedule: string;
    startDate: string;
    endDate: string;
    progress: string;
    output: string;
    otherNote: string;
    zoomLink: string;
    successorLink: string;
    materials: string;
    scores: Record<string, any>;
    finalScores: Record<string, any>;
    cycles: Record<string, any>[];
}
export declare const Aca11ClassSchema: MongooseSchema<Aca11Class, import("mongoose").Model<Aca11Class, any, any, any, any, any, Aca11Class>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    status?: import("mongoose").SchemaDefinitionProperty<"Đang diễn ra" | "Bảo lưu" | "Đã kết thúc", Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    className?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    inputNeed?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    teacher?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    schedule?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startDate?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    progress?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    output?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    otherNote?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    zoomLink?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    successorLink?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    materials?: import("mongoose").SchemaDefinitionProperty<string, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scores?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    finalScores?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cycles?: import("mongoose").SchemaDefinitionProperty<Record<string, any>[], Aca11Class, import("mongoose").Document<unknown, {}, Aca11Class, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Aca11Class & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Aca11Class>;
