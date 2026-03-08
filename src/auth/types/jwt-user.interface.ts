// src/auth/types/jwt-user.interface.ts
export interface JwtUser {
  sub: string;
  id : string;           // user id
  email?: string;
  tenantId?: string | null;
  tenantName?: string | null;  // tenant name from database
  roles?: string[];      // role codes
  iat?: number;
  exp?: number;
}
