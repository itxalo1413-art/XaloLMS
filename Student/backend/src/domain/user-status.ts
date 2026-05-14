export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export function isUserStatus(value: string): value is UserStatus {
  return (USER_STATUSES as readonly string[]).includes(value);
}
