export const usePermissions = (moduleSlug) => {
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }

  // If there's no user, or they don't have a role, default to false
  if (!user || !user.role) {
    return { canRead: false, canCreate: false, canEdit: false, canDelete: false };
  }

  // Owner/Admin role always has full access
  if (user.role.name === 'OWNER' || user.role.name === 'ADMIN' || user.role.name === 'Admin') {
    return { canRead: true, canCreate: true, canEdit: true, canDelete: true };
  }

  // Extract permissions from user or user.role
  let rawPermissions = user.permissions || (user.role && user.role.permissions) || {};
  let permissions = {};
  if (rawPermissions) {
    try {
      permissions = typeof rawPermissions === 'string' ? JSON.parse(rawPermissions) : rawPermissions;
    } catch (e) {
      console.error('Error parsing user permissions', e);
    }
  }

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

