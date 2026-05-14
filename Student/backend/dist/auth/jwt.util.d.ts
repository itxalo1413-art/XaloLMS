import type { SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from './auth.types';
export declare function signAccessToken(payload: JwtPayload, secret: string, options?: SignOptions): string;
export declare function verifyAccessToken(token: string, secret: string): JwtPayload;
export declare function getJwtSecret(): string;
