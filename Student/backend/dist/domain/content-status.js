"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTENT_STATUSES = void 0;
exports.isContentStatus = isContentStatus;
exports.CONTENT_STATUSES = [
    'draft',
    'pending',
    'published',
    'hidden',
];
function isContentStatus(value) {
    return exports.CONTENT_STATUSES.includes(value);
}
//# sourceMappingURL=content-status.js.map