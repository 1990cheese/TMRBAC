import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard'; // Import the new guard
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./components/dashboard-layout/dashboard-layout').then(m => m.DashboardLayout),
    canActivate: [authGuard]
  },
  {
    path: 'admin/organizations',
    loadComponent: () => import('./components/admin/organization-management/organization-management.component').then(m => m.OrganizationManagementComponent),
    canActivate: [authGuard, adminGuard] // Protect with both guards
  },
  {
    path: 'admin/users', // The new route
    loadComponent: () => import('./components/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard, adminGuard] // Protect it
  },
];