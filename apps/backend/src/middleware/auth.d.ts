import { Role } from '@prisma/client';
/**
 * Checks if a user role has access to perform operations that require any of the allowed roles.
 * This function provides flexible role checking without strict TypeScript type constraints.
 *
 * @param userRole - The user's current role
 * @param allowedRoles - Array of role strings that are allowed for the operation
 * @returns boolean - true if the user role is included in the allowed roles
 */
export declare function hasRole(userRole: Role, allowedRoles: string[]): boolean;
/**
 * Helper function to create role permission middleware that checks if user has required permissions.
 * This enables DISPLAY and STAFF roles to access operations they were previously blocked from.
 *
 * @param allowedRoles - Array of role strings that are allowed
 * @returns Function that can be used in TRPC middleware
 */
export declare function requireRole(allowedRoles: string[]): (userRole: Role) => boolean;
export declare const ROLE_PERMISSIONS: {
    ADMIN_ONLY: string[];
    MANAGEMENT: string[];
    STAFF_OPERATIONS: string[];
    READ_ONLY: string[];
    TOURNAMENT_OPERATIONS: string[];
    PLAYER_MANAGEMENT: string[];
    TABLE_MANAGEMENT: string[];
};
//# sourceMappingURL=auth.d.ts.map