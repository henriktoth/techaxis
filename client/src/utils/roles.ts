import type { User } from '../types';

type Role = User['role'];

export function isAdminRole(role: Role | undefined): boolean {
    return role === 'ADMIN' || role === 'SUPERADMIN';
}

export function isSuperAdmin(role: Role | undefined): boolean {
    return role === 'SUPERADMIN';
}
