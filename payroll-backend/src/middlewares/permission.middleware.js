const { errorResponse } = require("../utils/response");
const db = require("../database/models");

/**
 * Middleware to check if the authenticated user has the required permission
 * @param {string} moduleSlug - The slug of the module (e.g., 'company', 'employee')
 * @param {string} action - The action required (e.g., 'read', 'create', 'update', 'delete')
 */
const requirePermission = (moduleSlug, action) => {
    return async (req, res, next) => {
        try {
            // req.user is set by authenticateJWT
            if (!req.user || !req.user.id) {
                return res.status(403).json(
                    errorResponse("FORBIDDEN", "User not found in session.", "Access denied.")
                );
            }

            // The JWT might contain role info, but it might not have the full permissions object,
            // or the permissions object might be outdated. It's safer to fetch the role from the DB.
            const user = await db.User.findByPk(req.user.id, {
                include: [{ model: db.Role, as: 'role' }]
            });

            if (!user || !user.role) {
                 return res.status(403).json(
                    errorResponse("FORBIDDEN", "User or role no longer exists.", "Access denied.")
                );
            }

            let permissions = user.role.permissions || {};
            if (typeof permissions === 'string') {
                try {
                    permissions = JSON.parse(permissions);
                } catch(e) {}
            }
            
            let hasAccess = false;

            if (Array.isArray(permissions)) {
                // Older legacy format where permissions was just an array of slugs: ['company', 'employee']
                hasAccess = permissions.includes(moduleSlug);
            } else {
                const modulePerm = permissions[moduleSlug];
                
                if (typeof modulePerm === 'boolean') {
                    // Backward compatibility: If the permission is just a boolean, it means full access if true.
                    hasAccess = modulePerm === true;
                } else if (typeof modulePerm === 'object' && modulePerm !== null) {
                    // Granular check
                    hasAccess = modulePerm[action] === true;
                }
            }

            // Optional: Hardcode an override for OWNER role or super admin
            if (user.role.name === "OWNER") {
                hasAccess = true;
            }

            if (!hasAccess) {
                return res.status(403).json(
                    errorResponse(
                        "FORBIDDEN",
                        `Missing '${action}' permission for module '${moduleSlug}'.`,
                        "You do not have permission to perform this action."
                    )
                );
            }

            next();
        } catch (error) {
            console.error("Permission Check Error:", error);
            return res.status(500).json(
                errorResponse("SERVER_ERROR", error.message, "An error occurred checking permissions.")
            );
        }
    };
};

module.exports = requirePermission;
