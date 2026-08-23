export type Role = 'sales' | 'operations' | 'qc' | 'packaging' | 'inventory' | 'management';

// UI-experience permission only. Real authorization is enforced by the backend, not by this list.
export type Permission = string;

export interface User {
  id: string;
  displayName: string;
  roles: Role[];
}

export interface Session {
  user: User;
  permissions: Permission[];
}
