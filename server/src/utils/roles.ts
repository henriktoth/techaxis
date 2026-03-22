const ROLE_HIERARCHY: Record<string, number> = {
    READER: 0,
    WRITER: 1,
    ADMIN: 2,
    SUPERADMIN: 3,
};

/**
 * Utility function to check if a role is an admin role (ADMIN or SUPERADMIN).
 * @param role The role to check
 * @returns True if the role is ADMIN or SUPERADMIN, false otherwise
 */
export function isAdminRole(role: string): boolean {
    return role === 'ADMIN' || role === 'SUPERADMIN';
}

/**
 * Utility function to check if the actor's role is higher than the target's role based on the defined hierarchy.
 * @param actorRole The role of the actor
 * @param targetRole The role of the target
 * @returns True if the actor's role is higher, false otherwise
 */
export function isHigherThan(actorRole: string, targetRole: string): boolean {
    return (ROLE_HIERARCHY[actorRole] ?? -1) > (ROLE_HIERARCHY[targetRole] ?? -1);
}
