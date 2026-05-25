"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_TEST_STATUSES = void 0;
exports.isMockTestStatus = isMockTestStatus;
exports.MOCK_TEST_STATUSES = ['pending', 'approved', 'rejected'];
function isMockTestStatus(value) {
    return exports.MOCK_TEST_STATUSES.includes(value);
}
//# sourceMappingURL=mock-test.constants.js.map