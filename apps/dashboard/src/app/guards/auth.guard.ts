import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AccessWarningService } from '../services/access-warning.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const warningService = inject(AccessWarningService);

  if (authService.isAuthenticated()) {
    return true;
  }
  warningService.showWarning('You must be logged in to access this page.');
  return router.parseUrl('/login');
};