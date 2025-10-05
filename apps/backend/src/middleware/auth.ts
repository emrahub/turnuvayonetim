import { Role } from '@prisma/client';

/**
 * Checks if a user role has access to perform operations that require any of the allowed roles.
 * This function provides flexible role checking without strict TypeScript type constraints.
 *
 * @param userRole - The user's current role
 * @param allowedRoles - Array of role strings that are allowed for the operation
 * @returns boolean - true if the user role is included in the allowed roles
 */
export function hasRole(userRole: Role, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Helper function to create role permission middleware that checks if user has required permissions.
 * This enables DISPLAY and STAFF roles to access operations they were previously blocked from.
 *
 * @param allowedRoles - Array of role strings that are allowed
 * @returns Function that can be used in TRPC middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (userRole: Role) => {
    return hasRole(userRole, allowedRoles);
  };
}

// Common role permission sets for different operation types
export const ROLE_PERMISSIONS = {
  // Full administrative access
  ADMIN_ONLY: [Role.ADMIN] as string[],

  // Management and administrative access
  MANAGEMENT: [Role.ADMIN, Role.DIRECTOR] as string[],

  // Staff operations (includes DIRECTOR and STAFF for most operations)
  STAFF_OPERATIONS: [Role.ADMIN, Role.DIRECTOR, Role.STAFF] as string[],

  // Read-only operations (all roles can view)
  READ_ONLY: [Role.OWNER, Role.ADMIN, Role.DIRECTOR, Role.STAFF, Role.DISPLAY] as string[],

  // Tournament operations (includes DIRECTOR for tournament management)
  TOURNAMENT_OPERATIONS: [Role.ADMIN, Role.DIRECTOR, Role.STAFF] as string[],

  // Player management (includes DIRECTOR and STAFF)
  PLAYER_MANAGEMENT: [Role.ADMIN, Role.DIRECTOR, Role.STAFF] as string[],

  // Table management (includes STAFF for table operations)
  TABLE_MANAGEMENT: [Role.ADMIN, Role.DIRECTOR, Role.STAFF] as string[]
};