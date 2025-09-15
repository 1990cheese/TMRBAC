import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AccessWarningService } from '../services/access-warning.service';
import { RoleName } from '../../../../libs/ui-data/users/user.model';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const warningService = inject(AccessWarningService);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      const allowedRoles = ['admin', 'owner', 'ADMIN', 'OWNER'];
      let userRole: string | undefined = undefined;
      if (Array.isArray((user as any).roles) && (user as any).roles.length > 0) {
        userRole = (user as any).roles[0]?.name?.toLowerCase();
      } else if ((user as any).role) {
        userRole = (user as any).role?.toLowerCase();
      }
      if (userRole && allowedRoles.includes(userRole)) {
        return true;
      }
      warningService.showWarning('You do not have permission to access this page.');
      return router.parseUrl('/tasks');
    })
  );
};