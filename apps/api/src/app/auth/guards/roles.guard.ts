import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, ROLE_KEY, PERMISSION_KEY } from '../../../../../libs/data'; // Import User entity

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true; // No roles or permissions required, access granted
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false; // No user authenticated
    }

    // Check for required roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) => user.roles?.some((userRole) => userRole.name === role));
      if (!hasRequiredRole) {
        return false;
      }
    }

    // Check for required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = user.roles?.flatMap(role => role.permissions?.map(perm => perm.name)) || [];
      const hasRequiredPermission = requiredPermissions.every((permission) => userPermissions.includes(permission));
      if (!hasRequiredPermission) {
        return false;
      }
    }

    return true; // User has required roles/permissions
  }
}