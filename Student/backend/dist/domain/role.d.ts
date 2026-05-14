export declare const ROLES: readonly ["HS", "GV", "ACA"];
export type Role = (typeof ROLES)[number];
export declare function isRole(value: string): value is Role;
