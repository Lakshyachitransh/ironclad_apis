// src/roles/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator — defines required roles for a route.
 * Example: @Roles('superadmin', 'org_admin')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
