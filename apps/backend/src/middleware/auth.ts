import { UserRole } from '@prisma/client';

/**
 * Checks if a user role has access to perform operations that require any of the allowed roles.
 * This function provides flexible role checking without strict TypeScript type constraints.
 *
 * @param userRole - The user's current role
 * @param allowedRoles - Array of role strings that are allowed for the operation
 * @returns boolean - true if the user role is included in the allowed roles
 */
export function hasRole(userRole: UserRole, allowedRoles: string[]): boolean {
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
  return (userRole: UserRole) => {
    return hasRole(userRole, allowedRoles);
  };
}

// Common role permission sets for different operation types
export const ROLE_PERMISSIONS = {
  // Full administrative access
  ADMIN_ONLY: [UserRole.ADMIN] as string[],

  // Management and administrative access
  MANAGEMENT: [UserRole.ADMIN, UserRole.MANAGER] as string[],

  // Staff operations (includes MANAGER and DEALER for most operations)
  STAFF_OPERATIONS: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEALER] as string[],

  // Read-only operations (all roles can view)
  READ_ONLY: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEALER, UserRole.PLAYER, UserRole.VIEWER] as string[],

  // Tournament operations (includes MANAGER for tournament management)
  TOURNAMENT_OPERATIONS: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEALER] as string[],

  // Player management (includes MANAGER and DEALER)
  PLAYER_MANAGEMENT: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEALER] as string[],

  // Table management (includes DEALER for table operations)
  TABLE_MANAGEMENT: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEALER] as string[]
};