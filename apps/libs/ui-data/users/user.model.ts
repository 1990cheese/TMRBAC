export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  roleName?: string;
}

export type RoleName = 'user' | 'admin' | 'manager';
