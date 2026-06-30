import { useAuth } from '../../../modules/auth/context/AuthContext';

/**
 * Hook to check granular permissions for a given module
 * @param {string} moduleSlug - The slug of the module to check (e.g., 'company', 'employee')
 * @returns {object} An object with boolean flags: { canRead, canCreate, canEdit, canDelete }
 */
export const usePermissions = (moduleSlug) => {
  const { user } = useAuth();

  // If there's no user, or they don't have a role, default to false
  if (!user || !user.role) {
    return { canRead: false, canCreate: false, canEdit: false, canDelete: false };
  }

  // Owner role always has full access
  if (user.role.name === 'OWNER') {
    return { canRead: true, canCreate: true, canEdit: true, canDelete: true };
  }

  const permissions = user.permissions || {};
  const modulePerm = permissions[moduleSlug];

  let canRead = false;
  let canCreate = false;
  let canEdit = false;
  let canDelete = false;

  if (typeof modulePerm === 'boolean') {
    // Backward compatibility for old boolean flags
    canRead = modulePerm;
    canCreate = modulePerm;
    canEdit = modulePerm;
    canDelete = modulePerm;
  } else if (typeof modulePerm === 'object' && modulePerm !== null) {
    // Granular permissions
    canRead = !!modulePerm.read;
    canCreate = !!modulePerm.create;
    canEdit = !!modulePerm.edit;
    canDelete = !!modulePerm.delete;
  }

  return { canRead, canCreate, canEdit, canDelete };
};
