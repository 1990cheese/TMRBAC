export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  roleName?: string;
  roles?: { name: string }[];
}

export type RoleName = 'USER' | 'ADMIN' | 'OWNER';
