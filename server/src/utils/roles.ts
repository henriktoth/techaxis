const ROLE_HIERARCHY: Record<string, number> = {
    READER: 0,
    WRITER: 1,
    ADMIN: 2,
    SUPERADMIN: 3,
};

export function isAdminRole(role: string): boolean {
    return role === 'ADMIN' || role === 'SUPERADMIN';
}

export function isHigherThan(actorRole: string, targetRole: string): boolean {
    return (ROLE_HIERARCHY[actorRole] ?? -1) > (ROLE_HIERARCHY[targetRole] ?? -1);
}
