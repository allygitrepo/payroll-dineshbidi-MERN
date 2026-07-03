const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Role, RefreshToken } = require("../../../database/models");

/**
 * Helper to calculate expiry date based on environment variable string (e.g., '30d', '7d')
 */
const calculateExpiryDate = (expiryStr) => {
    const value = parseInt(expiryStr, 10) || 30;
    const unit = expiryStr.slice(-1).toLowerCase();
    const date = new Date();
    
    if (unit === "d") {
        date.setDate(date.getDate() + value);
    } else if (unit === "h") {
        date.setHours(date.getHours() + value);
    } else if (unit === "m") {
        date.setMinutes(date.getMinutes() + value);
    } else {
        date.setDate(date.getDate() + 30); // Default to 30 days
    }
    return date;
};

/**
 * Service class handling all Business Logic and DB Operations for Users and Session management.
 */
class UsersService {
    /**
     * Registers a new user.
     */
    static async registerUser({ user_name, user_id, password, role_id, parent_id }) {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { user_id, status: true } });
        if (existingUser) {
            const error = new Error("User ID already registered.");
            error.statusCode = 400;
            error.errorCode = "USER_ALREADY_EXISTS";
            error.messageToShow = "User ID is already registered.";
            throw error;
        }

        // Hash and salt the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create the user
        const newUser = await User.create({
            user_name,
            user_id,
            password: hashedPassword,
            role_id: role_id || null,
            parent_id: parent_id || null,
        });

        // Return user details without password
        const userJson = newUser.toJSON();
        delete userJson.password;
        return userJson;
    }

    /**
     * Authenticates a user and generates access & refresh tokens.
     */
    static async loginUser({ user_id, password, company_id }) {
        // Find the user
        const user = await User.findOne({ 
            where: { user_id, status: true },
            include: [{ model: Role, as: 'role' }]
        });
        if (!user) {
            const error = new Error("User does not exist.");
            error.statusCode = 404;
            error.errorCode = "USER_NOT_FOUND";
            error.messageToShow = "User does not exist.";
            throw error;
        }

        // Compare password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            const error = new Error("Invalid password.");
            error.statusCode = 401;
            error.errorCode = "INVALID_PASSWORD";
            error.messageToShow = "Invalid password.";
            throw error;
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { 
                id: user.id, 
                user_id: user.user_id, 
                role_id: user.role_id, 
                role_name: user.role?.name || null,
                contractor_id: user.contractor_id,
                company_id 
            },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
        );

        const refreshToken = jwt.sign(
            { id: user.id, company_id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_EXPIRES_IN || "30d" }
        );

        // Store refresh token in database
        const expiresAt = calculateExpiryDate(process.env.REFRESH_EXPIRES_IN || "30d");
        await RefreshToken.create({
            user_id: user.id,
            token: refreshToken,
            expires_at: expiresAt,
        });

        const userJson = user.toJSON();
        delete userJson.password;

        return {
            user: userJson,
            accessToken,
            refreshToken,
        };
    }

    /**
     * Select a company and get new tokens.
     */
    static async selectCompany(userId, companyId) {
        const user = await User.findOne({ 
            where: { id: userId, status: true },
            include: [{ model: Role, as: 'role' }]
        });
        if (!user) {
            const error = new Error("User not found or inactive.");
            error.statusCode = 404;
            error.errorCode = "USER_NOT_FOUND";
            error.messageToShow = "User not found or inactive.";
            throw error;
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { 
                id: user.id, 
                user_id: user.user_id, 
                role_id: user.role_id, 
                role_name: user.role?.name || null,
                contractor_id: user.contractor_id,
                company_id: companyId 
            },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
        );

        const refreshToken = jwt.sign(
            { id: user.id, company_id: companyId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_EXPIRES_IN || "30d" }
        );

        // Store refresh token in database
        const expiresAt = calculateExpiryDate(process.env.REFRESH_EXPIRES_IN || "30d");
        await RefreshToken.create({
            user_id: user.id,
            token: refreshToken,
            expires_at: expiresAt,
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    /**
     * Refreshes access and refresh tokens using Refresh Token Rotation.
     */
    static async refreshSession(token) {
        if (!token) {
            const error = new Error("Refresh token missing.");
            error.statusCode = 400;
            error.errorCode = "TOKEN_MISSING";
            error.messageToShow = "Session token is missing. Please log in again.";
            throw error;
        }

        // Check if token exists in DB
        const storedToken = await RefreshToken.findOne({ where: { token } });
        if (!storedToken) {
            const error = new Error("Invalid or revoked refresh token.");
            error.statusCode = 401;
            error.errorCode = "TOKEN_REVOKED";
            error.messageToShow = "Your session has been logged out or is invalid. Please log in again.";
            throw error;
        }

        // Verify if token is expired in DB
        if (new Date() > new Date(storedToken.expires_at)) {
            await storedToken.destroy();
            const error = new Error("Refresh token expired.");
            error.statusCode = 401;
            error.errorCode = "TOKEN_EXPIRED";
            error.messageToShow = "Session expired. Please log in again.";
            throw error;
        }

        try {
            // Verify JWT signature
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            
            // Get user
            const user = await User.findOne({ 
                where: { id: decoded.id, status: true },
                include: [{ model: Role, as: 'role' }]
            });
            if (!user) {
                const error = new Error("User associated with this token not found or inactive.");
                error.statusCode = 401;
                error.errorCode = "USER_INACTIVE";
                error.messageToShow = "User account is inactive or not found.";
                throw error;
            }

            // Generate new pair (Refresh Token Rotation)
            const newAccessToken = jwt.sign(
                { 
                    id: user.id, 
                    user_id: user.user_id, 
                    role_id: user.role_id, 
                    role_name: user.role?.name || null,
                    contractor_id: user.contractor_id,
                    company_id: decoded.company_id 
                },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
            );

            const newRefreshToken = jwt.sign(
                { id: user.id, company_id: decoded.company_id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.REFRESH_EXPIRES_IN || "30d" }
            );

            // Delete old token
            await storedToken.destroy();

            // Store new refresh token
            const expiresAt = calculateExpiryDate(process.env.REFRESH_EXPIRES_IN || "30d");
            await RefreshToken.create({
                user_id: user.id,
                token: newRefreshToken,
                expires_at: expiresAt,
            });

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        } catch (err) {
            // If token verification fails, cleanup token from database
            await storedToken.destroy().catch(() => {});
            const error = new Error("Invalid refresh token signature.");
            error.statusCode = 401;
            error.errorCode = "TOKEN_INVALID";
            error.messageToShow = "Invalid session signature. Please log in again.";
            throw error;
        }
    }

    /**
     * Revokes a refresh token (Logout).
     */
    static async logoutUser(token) {
        if (token) {
            await RefreshToken.destroy({ where: { token } });
        }
        return true;
    }

    /**
     * Gets active user profile details.
     */
    static async getUserProfile(id) {
        const user = await User.findOne({ where: { id, status: true } });
        if (!user) {
            const error = new Error("User not found.");
            error.statusCode = 404;
            error.errorCode = "USER_NOT_FOUND";
            error.messageToShow = "User not found.";
            throw error;
        }

        const userJson = user.toJSON();
        delete userJson.password;
        return userJson;
    }

    /**
     * Gets all users
     */
    static async getAllUsers(currentUser) {
        const { Op } = require("sequelize");
        const whereClause = { status: true };
        
        if (currentUser) {
            const roleName = currentUser.role_name || '';
            const isOwner = roleName.toUpperCase() === 'OWNER' || roleName.toUpperCase().startsWith('OWNER');

            if (isOwner) {
                // Fetch all contractor IDs belonging to the owner's selected company
                let contractorIds = [];
                if (currentUser.company_id) {
                    const contractors = await User.sequelize.models.Contractor.findAll({
                        where: { company_id: currentUser.company_id, status: true },
                        attributes: ['id']
                    });
                    contractorIds = contractors.map(c => c.id);
                }

                // Retrieve staff users (by parent_id matching owner/company) or contractor users
                whereClause[Op.or] = [
                    {
                        parent_id: currentUser.company_id ? {
                            [Op.in]: [currentUser.id, currentUser.company_id]
                        } : currentUser.id
                    },
                    {
                        contractor_id: {
                            [Op.in]: contractorIds
                        }
                    }
                ];
            } else {
                // Default legacy behavior for other roles
                if (currentUser.company_id) {
                    whereClause.parent_id = {
                        [Op.in]: [currentUser.id, currentUser.company_id]
                    };
                } else {
                    whereClause.parent_id = currentUser.id;
                }
            }
        }

        const users = await User.findAll({
            where: whereClause,
            include: [{ model: Role, as: 'role' }]
        });

        return users.map(user => {
            const userJson = user.toJSON();
            delete userJson.password;
            return userJson;
        });
    }

    /**
     * Updates an existing user's details.
     */
    static async updateUser(id, updateData) {
        const user = await User.findOne({ where: { id, status: true } });
        if (!user) {
            const error = new Error("User not found.");
            error.statusCode = 404;
            error.errorCode = "USER_NOT_FOUND";
            error.messageToShow = "User not found.";
            throw error;
        }

        // If password is being updated, hash it
        if (updateData.password) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(updateData.password, saltRounds);
        }

        // If user_id is changed, check for conflict
        if (updateData.user_id && updateData.user_id !== user.user_id) {
            const conflictUser = await User.findOne({ where: { user_id: updateData.user_id, status: true } });
            if (conflictUser) {
                const error = new Error("User ID is already taken.");
                error.statusCode = 400;
                error.errorCode = "USER_ID_CONFLICT";
                error.messageToShow = "User ID is already taken.";
                throw error;
            }
        }

        // Perform update
        await user.update(updateData);

        const updatedUserJson = user.toJSON();
        delete updatedUserJson.password;
        return updatedUserJson;
    }

    /**
     * Soft-deletes a user.
     */
    static async deleteUser(id) {
        const user = await User.findOne({ where: { id, status: true } });
        if (!user) {
            const error = new Error("User not found.");
            error.statusCode = 404;
            error.errorCode = "USER_NOT_FOUND";
            error.messageToShow = "User not found.";
            throw error;
        }

        // Soft delete (setting status to false)
        await user.update({
            status: false,
        });

        // Revoke all refresh tokens for this user
        await RefreshToken.destroy({ where: { user_id: id } });

        return true;
    }
}

module.exports = UsersService;
