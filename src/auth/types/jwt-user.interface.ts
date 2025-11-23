// src/auth/types/jwt-user.interface.ts
export interface JwtUser {
  sub: string;
  id : string;           // user id
  email?: string;
  tenantId?: string | null;
  roles?: string[];      // role codes
  iat?: number;
  exp?: number;
}
