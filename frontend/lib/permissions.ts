import { Role } from '@/app/generated/prisma';
import { Session } from 'next-auth';

// Role hierarchy levels (higher number = more permissions)
const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MODERATOR: 2,
  VIEWER: 1,
};

/**
 * Check if a user has the required role or higher in the hierarchy
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns True if user has sufficient permissions
 */
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Require a specific role or throw an error
 * @param session - The user's session (can be null)
 * @param requiredRole - The minimum required role
 * @throws Error if user is not authenticated or lacks permissions
 */
export function requireRole(
  session: Session | null,
  requiredRole: Role
): asserts session is Session {
  if (!session) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (!hasPermission(session.user.role, requiredRole)) {
    throw new Error(
      `Forbidden: ${requiredRole} role or higher required. Current role: ${session.user.role}`
    );
  }
}

/**
 * Get all roles that are at or above a certain level
 * @param minimumRole - The minimum role level
 * @returns Array of roles with sufficient permissions
 */
export function getRolesWithPermission(minimumRole: Role): Role[] {
  const minimumLevel = ROLE_HIERARCHY[minimumRole];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level >= minimumLevel)
    .map(([role, _]) => role as Role);
}

/**
 * Check if a role can manage (modify/delete) another role
 * Generally, a role can only manage roles below it in the hierarchy
 * @param actorRole - The role of the user performing the action
 * @param targetRole - The role being managed
 * @returns True if the actor can manage the target role
 */
export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}
