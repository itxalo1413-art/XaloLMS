export const ROLES = ['HS', 'GV', 'ACA', 'SALE', 'GRADER'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Portal điều phối học thuật (full ACA). */
export const ACA_ONLY: Role[] = ['ACA'];

/** Sale + ACA — booking / BCB / lead. */
export const ACA_SALE: Role[] = ['ACA', 'SALE'];

/** Grader + ACA — chấm bài / lịch rảnh. */
export const ACA_GRADER: Role[] = ['ACA', 'GRADER'];

/** GV + ACA (+ grader khi cần xem lớp). */
export const ACA_GV: Role[] = ['ACA', 'GV'];

/** Mọi staff (không gồm HS). */
export const STAFF: Role[] = ['ACA', 'SALE', 'GRADER', 'GV'];

/** Mọi role đã đăng nhập. */
export const ANY_AUTH: Role[] = ['HS', 'GV', 'ACA', 'SALE', 'GRADER'];
