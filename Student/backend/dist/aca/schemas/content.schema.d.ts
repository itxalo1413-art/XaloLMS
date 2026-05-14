import { HydratedDocument } from 'mongoose';
import type { ContentStatus } from '../../domain/content-status';
export type ContentDocument = HydratedDocument<Content>;
export declare class Content {
    title: string;
    description: string;
    categorySlug: string;
    tags: string[];
    status: ContentStatus;
}
export declare const ContentSchema: import("mongoose").Schema<Content, import("mongoose").Model<Content, any, any, any, any, any, Content>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Content, import("mongoose").Document<unknown, {}, Content, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    title?: import("mongoose").SchemaDefinitionProperty<string, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    categorySlug?: import("mongoose").SchemaDefinitionProperty<string, Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tags?: import("mongoose").SchemaDefinitionProperty<string[], Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"draft" | "pending" | "published" | "hidden", Content, import("mongoose").Document<unknown, {}, Content, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Content>;
