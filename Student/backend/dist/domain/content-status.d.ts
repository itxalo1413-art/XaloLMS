export declare const CONTENT_STATUSES: readonly ["draft", "pending", "published", "hidden"];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export declare function isContentStatus(value: string): value is ContentStatus;
