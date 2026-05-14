"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoUri = getMongoUri;
const PLACEHOLDER_SNIPPETS = [
    '<db_password>',
    '<password>',
    'YOUR_DB_PASSWORD',
];
function applyAtlasAuthSource(uri) {
    let parsed;
    try {
        parsed = new URL(uri);
    }
    catch {
        return uri;
    }
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('.mongodb.net')) {
        return uri;
    }
    if (parsed.searchParams.has('authSource')) {
        return uri;
    }
    parsed.searchParams.set('authSource', 'admin');
    return parsed.toString();
}
function assertNoPasswordPlaceholders(uri) {
    const lower = uri.toLowerCase();
    for (const p of PLACEHOLDER_SNIPPETS) {
        if (lower.includes(p.toLowerCase())) {
            throw new Error(`MONGODB_URI vẫn chứa placeholder mật khẩu (${p}). Thay bằng mật khẩu thật, hoặc dùng MONGODB_USER + MONGODB_PASSWORD (xem .env.example).`);
        }
    }
}
function buildUriFromParts() {
    const user = process.env.MONGODB_USER?.trim();
    const password = process.env.MONGODB_PASSWORD;
    const host = process.env.MONGODB_HOST?.trim();
    if (!user || password === undefined || password === '' || !host) {
        return null;
    }
    const db = (process.env.MONGODB_DB ?? 'XaloLMS').trim() || 'XaloLMS';
    const appName = (process.env.MONGODB_APP_NAME ?? 'AdminMedia').trim() || 'AdminMedia';
    const userEnc = encodeURIComponent(user);
    const passEnc = encodeURIComponent(password);
    const appEnc = encodeURIComponent(appName);
    return `mongodb+srv://${userEnc}:${passEnc}@${host}/${db}?appName=${appEnc}&authSource=admin`;
}
function getMongoUri() {
    const uriFromEnv = process.env.MONGODB_URI?.trim();
    if (uriFromEnv) {
        assertNoPasswordPlaceholders(uriFromEnv);
        return applyAtlasAuthSource(uriFromEnv);
    }
    const fromParts = buildUriFromParts();
    if (!fromParts) {
        throw new Error('Thiếu cấu hình MongoDB: đặt MONGODB_URI, hoặc đủ MONGODB_USER + MONGODB_PASSWORD + MONGODB_HOST (xem .env.example).');
    }
    return applyAtlasAuthSource(fromParts);
}
//# sourceMappingURL=mongo-uri.js.map