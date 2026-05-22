"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedAvatarImageMime = isAllowedAvatarImageMime;
const ALLOWED = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
]);
function isAllowedAvatarImageMime(mime) {
    if (!mime)
        return false;
    const base = mime.toLowerCase().split(';')[0].trim();
    return ALLOWED.has(base);
}
//# sourceMappingURL=avatar-image.util.js.map