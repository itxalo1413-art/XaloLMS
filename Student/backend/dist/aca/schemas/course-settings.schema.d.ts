import { HydratedDocument } from 'mongoose';
export type CourseSettingsDocument = HydratedDocument<CourseSettings>;
export declare class CoursePhaseSchemaClass {
    name: string;
    date: string;
}
export declare class CourseImportantLinkSchemaClass {
    id: string;
    label: string;
    value: string;
    url: string;
}
export declare class CourseSettings {
    course: string;
    room: string;
    instructor: string;
    zoomPassword: string;
    schedule: string[];
    openDate: string;
    endDate: string;
    phases: CoursePhaseSchemaClass[];
    links: CourseImportantLinkSchemaClass[];
}
export declare const CourseSettingsSchema: import("mongoose").Schema<CourseSettings, import("mongoose").Model<CourseSettings, any, any, any, any, any, CourseSettings>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    course?: import("mongoose").SchemaDefinitionProperty<string, CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    room?: import("mongoose").SchemaDefinitionProperty<string, CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    instructor?: import("mongoose").SchemaDefinitionProperty<string, CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    zoomPassword?: import("mongoose").SchemaDefinitionProperty<string, CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    schedule?: import("mongoose").SchemaDefinitionProperty<string[], CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    openDate?: import("mongoose").SchemaDefinitionProperty<string, CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<string, CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phases?: import("mongoose").SchemaDefinitionProperty<CoursePhaseSchemaClass[], CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    links?: import("mongoose").SchemaDefinitionProperty<CourseImportantLinkSchemaClass[], CourseSettings, import("mongoose").Document<unknown, {}, CourseSettings, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CourseSettings & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, CourseSettings>;
