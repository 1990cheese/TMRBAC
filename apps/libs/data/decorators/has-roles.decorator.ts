import { SetMetadata } from '@nestjs/common';
import { RoleName, PermissionName } from '..';

export const ROLE_KEY = 'roles';
export const PERMISSION_KEY = 'permissions';

/**
 * Decorator to specify required roles for a route handler or class.
 * Usage: @HasRoles(RoleName.ADMIN, RoleName.MANAGER)
 * @param roles The roles required to access the resource.
 */
export const HasRoles = (...roles: RoleName[]) => SetMetadata(ROLE_KEY, roles);

/**
 * Decorator to specify required permissions for a route handler or class.
 * Usage: @HasPermissions(PermissionName.CREATE_TASK, PermissionName.DELETE_USER)
 * @param permissions The permissions required to access the resource.
 */
export const HasPermissions = (...permissions: PermissionName[]) => SetMetadata(PERMISSION_KEY, permissions);