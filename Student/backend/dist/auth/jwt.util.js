"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.getJwtSecret = getJwtSecret;
const jwt = __importStar(require("jsonwebtoken"));
const DEFAULT_SIGN_OPTIONS = { expiresIn: '7d' };
function signAccessToken(payload, secret, options = DEFAULT_SIGN_OPTIONS) {
    return jwt.sign(payload, secret, options);
}
function verifyAccessToken(token, secret) {
    const decoded = jwt.verify(token, secret);
    return {
        sub: String(decoded.sub),
        email: String(decoded.email),
        role: decoded.role,
        name: String(decoded.name),
    };
}
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret && secret.length >= 16)
        return secret;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set to a string of at least 16 characters in production');
    }
    return 'dev-only-jwt-secret-min-16';
}
//# sourceMappingURL=jwt.util.js.map