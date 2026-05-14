import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from './auth.types';

const DEFAULT_SIGN_OPTIONS: SignOptions = { expiresIn: '7d' };

export function signAccessToken(
  payload: JwtPayload,
  secret: string,
  options: SignOptions = DEFAULT_SIGN_OPTIONS,
): string {
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string, secret: string): JwtPayload {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload & JwtPayload;
  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
    role: decoded.role,
    name: String(decoded.name),
  };
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET must be set to a string of at least 16 characters in production',
    );
  }
  return 'dev-only-jwt-secret-min-16';
}
