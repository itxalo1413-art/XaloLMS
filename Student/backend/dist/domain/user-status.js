"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_STATUSES = void 0;
exports.isUserStatus = isUserStatus;
exports.USER_STATUSES = ['ACTIVE', 'INACTIVE'];
function isUserStatus(value) {
    return exports.USER_STATUSES.includes(value);
}
//# sourceMappingURL=user-status.js.map