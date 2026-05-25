export const MOCK_TEST_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type MockTestStatus = (typeof MOCK_TEST_STATUSES)[number];

export function isMockTestStatus(value: string): value is MockTestStatus {
  return (MOCK_TEST_STATUSES as readonly string[]).includes(value);
}
