import { useState, useEffect } from 'react';

/**
 * Hook to check granular permissions for a given module
 * @param {string} moduleSlug - The slug of the module to check (e.g., 'company', 'employee')
 * @returns {object} An object with boolean flags: { canRead, canCreate, canEdit, canDelete }
 */
export const usePermissions = (moduleSlug) => {
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canEdit: false,
    canDelete: false
  });

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (!user || (!user.role && !user.permissions)) return;

      // Owner role always has full access
      if (user.role && user.role.name === 'OWNER') {
        setPermissions({ canRead: true, canCreate: true, canEdit: true, canDelete: true });
        return;
      }

      let rawPermissions = null;
      if (user.role && user.role.permissions) {
        rawPermissions = user.role.permissions;
      } else if (user.permissions) {
        rawPermissions = user.permissions;
      }

      if (!rawPermissions) return;

      const parsedPerms = typeof rawPermissions === 'string' ? JSON.parse(rawPermissions) : rawPermissions;
      let canRead = false;
      let canCreate = false;
      let canEdit = false;
      let canDelete = false;

      if (Array.isArray(parsedPerms)) {
        // Legacy array of strings format
        const hasPerm = parsedPerms.includes(moduleSlug);
        canRead = hasPerm;
        canCreate = hasPerm;
        canEdit = hasPerm;
        canDelete = hasPerm;
      } else {
        const modulePerm = parsedPerms[moduleSlug];

        if (typeof modulePerm === 'boolean') {
          canRead = modulePerm;
          canCreate = modulePerm;
          canEdit = modulePerm;
          canDelete = modulePerm;
        } else if (typeof modulePerm === 'object' && modulePerm !== null) {
          canRead = !!modulePerm.read;
          canCreate = !!modulePerm.create;
          canEdit = !!modulePerm.edit;
          canDelete = !!modulePerm.delete;
        }
      }

      setPermissions({ canRead, canCreate, canEdit, canDelete });
    } catch (e) {
      console.error('Error in usePermissions hook:', e);
    }
  }, [moduleSlug]);

  return permissions;
};

