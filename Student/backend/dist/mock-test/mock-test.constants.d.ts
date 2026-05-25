export declare const MOCK_TEST_STATUSES: readonly ["pending", "approved", "rejected"];
export type MockTestStatus = (typeof MOCK_TEST_STATUSES)[number];
export declare function isMockTestStatus(value: string): value is MockTestStatus;
