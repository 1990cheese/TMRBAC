import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleName } from '../../../../libs/ui-data/users/user.model';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      // Adjust for new User model: roleName is a string property
      const isAdmin = user?.roleName === 'admin';
      if (isAdmin) {
        return true;
      }
      return router.parseUrl('/tasks'); // Redirect non-admins
    })
  );
};