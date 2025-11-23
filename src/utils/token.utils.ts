// src/utils/token.util.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export type TokenPayload = {
  userId: string;
  tenantId?: string;
  roles?: string[];
};

// runtime checks to ensure env vars exist
if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('Missing JWT_ACCESS_SECRET env var');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('Missing JWT_REFRESH_SECRET env var');
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as jwt.Secret;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as jwt.Secret;

// ---- Make expiresIn typed as jwt.SignOptions['expiresIn'] ----
// We cast from string to the SignOptions type to satisfy the definitions.
const ACCESS_EXP = (process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m') as unknown as jwt.SignOptions['expiresIn'];

const REFRESH_EXP_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 30);
// build the refresh expiresIn string like "30d" and type it
const REFRESH_EXP = (`${REFRESH_EXP_DAYS}d`) as unknown as jwt.SignOptions['expiresIn'];

export function createAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload as jwt.JwtPayload, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}

export function createRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload as jwt.JwtPayload, REFRESH_SECRET, { expiresIn: REFRESH_EXP });
}

export function createTokens(payload: TokenPayload) {
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken<T = TokenPayload>(token: string): T {
  return jwt.verify(token, ACCESS_SECRET) as T;
}

export function verifyRefreshToken<T = TokenPayload>(token: string): T {
  return jwt.verify(token, REFRESH_SECRET) as T;
}

export function computeRefreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_EXP_DAYS * 24 * 60 * 60 * 1000);
}
