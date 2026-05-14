export declare const USER_STATUSES: readonly ["ACTIVE", "INACTIVE"];
export type UserStatus = (typeof USER_STATUSES)[number];
export declare function isUserStatus(value: string): value is UserStatus;
