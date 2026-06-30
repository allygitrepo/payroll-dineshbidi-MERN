const UsersService = require("./users.service");
const { registerSchema, loginSchema, updateSchema } = require("./users.validators");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Controller class for Users Module.
 * Ensures Thin Controllers that delegate logic to UsersService and handle validations/responses.
 */
class UsersController {
    /**
     * Registers a new user.
     */
    static async register(req, res) {
        // Validate request body
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    error.details[0].message,
                    error.details[0].message,
                    error.details
                )
            );
        }

        try {
            const newUser = await UsersService.registerUser({
                user_name: value.user_name,
                user_id: value.user_id,
                password: value.password,
                role_id: value.role_id,
                parent_id: req.user ? req.user.id : null,
            });

            return res.status(201).json(
                successResponse(
                    "USER_REGISTERED",
                    "User registered successfully.",
                    "User registered successfully.",
                    newUser
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to register user."
                )
            );
        }
    }

    /**
     * User Login.
     */
    static async login(req, res) {
        // Validate request body
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    error.details[0].message,
                    error.details[0].message,
                    error.details
                )
            );
        }

        try {
            const { user, accessToken, refreshToken } = await UsersService.loginUser({
                user_id: value.user_id,
                password: value.password,
                company_id: value.company_id,
            });

            // Set refresh token in HTTP-only cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            return res.status(200).json(
                successResponse(
                    "LOGIN_SUCCESS",
                    "User authenticated successfully.",
                    "Login successful.",
                    {
                        user,
                        accessToken,
                    }
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "AUTHENTICATION_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Invalid login credentials."
                )
            );
        }
    }

    /**
     * Select a company and get new tokens.
     */
    static async selectCompany(req, res) {
        const { company_id } = req.body;
        const userId = req.user.id;

        try {
            const { accessToken, refreshToken } = await UsersService.selectCompany(userId, company_id);

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            return res.status(200).json(
                successResponse(
                    "COMPANY_SELECTED",
                    "Company selected and tokens refreshed.",
                    "Company selected successfully.",
                    { accessToken }
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "COMPANY_SELECT_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to select company."
                )
            );
        }
    }

    /**
     * Refresh access and refresh tokens.
     */
    static async refresh(req, res) {
        // Extract token from HTTP-only cookie or request body
        const token = req.cookies.refreshToken || req.body.refreshToken;

        try {
            const { accessToken, refreshToken: newRefreshToken } = await UsersService.refreshSession(token);

            // Set new refresh token in HTTP-only cookie
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            return res.status(200).json(
                successResponse(
                    "TOKEN_REFRESHED",
                    "Tokens rotated and refreshed successfully.",
                    "Session refreshed.",
                    {
                        accessToken,
                    }
                )
            );
        } catch (err) {
            // If refresh fails, clear the cookie
            res.clearCookie("refreshToken");

            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "REFRESH_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Session expired. Please login again."
                )
            );
        }
    }

    /**
     * User Logout.
     */
    static async logout(req, res) {
        const token = req.cookies.refreshToken || req.body.refreshToken;

        try {
            await UsersService.logoutUser(token);

            // Clear the cookie
            res.clearCookie("refreshToken");

            return res.status(200).json(
                successResponse(
                    "LOGOUT_SUCCESS",
                    "User logged out and session revoked.",
                    "Logged out successfully."
                )
            );
        } catch (err) {
            return res.status(500).json(
                errorResponse(
                    "LOGOUT_FAILED",
                    err.message,
                    "Failed to log out cleanly."
                )
            );
        }
    }

    /**
     * Get profile of logged-in user.
     */
    static async getProfile(req, res) {
        try {
            // req.user is set by auth middleware
            const profile = await UsersService.getUserProfile(req.user.id);

            return res.status(200).json(
                successResponse(
                    "PROFILE_RETRIEVED",
                    "User profile details retrieved.",
                    "Profile retrieved successfully.",
                    profile
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "PROFILE_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve profile."
                )
            );
        }
    }

    /**
     * Get all users.
     */
    static async getAll(req, res) {
        try {
            const users = await UsersService.getAllUsers(req.user);
            return res.status(200).json(
                successResponse(
                    "USERS_RETRIEVED",
                    "Users retrieved successfully.",
                    "Users retrieved.",
                    users
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "FETCH_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to fetch users."
                )
            );
        }
    }

    /**
     * Updates user details.
     */
    static async update(req, res) {
        const { id } = req.params;

        // Validate request body
        const { error, value } = updateSchema.validate(req.body);
        if (error) {
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    error.details[0].message,
                    error.details[0].message,
                    error.details
                )
            );
        }

        try {
            const updatedUser = await UsersService.updateUser(id, value);

            return res.status(200).json(
                successResponse(
                    "USER_UPDATED",
                    "User updated successfully.",
                    "User updated successfully.",
                    updatedUser
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update user."
                )
            );
        }
    }

    /**
     * Deletes user (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await UsersService.deleteUser(id);

            return res.status(200).json(
                successResponse(
                    "USER_DELETED",
                    "User deleted successfully.",
                    "User deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete user."
                )
            );
        }
    }
}

module.exports = UsersController;
