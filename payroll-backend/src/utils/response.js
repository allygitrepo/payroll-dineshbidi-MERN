/**
 * Formats a successful API response.
 * @param {string} code - Business logic code for frontend routing or checks
 * @param {string} message - Internal developer message for debugging
 * @param {string} messageToShow - User-facing friendly message
 * @param {object|array|null} [data={}] - Response payload
 * @returns {object} formatted success response
 */
const successResponse = (code, message, messageToShow, data = {}) => {
    return {
        status: true,
        code,
        message,
        messageToShow,
        data,
    };
};

/**
 * Formats an error API response.
 * @param {string} code - Business logic error code
 * @param {string} message - Detailed error description for logs/debugging
 * @param {string} messageToShow - User-facing friendly error message
 * @param {object|array|null} [data=null] - Additional error payload (e.g., validation errors)
 * @returns {object} formatted error response
 */
const errorResponse = (code, message, messageToShow, data = null) => {
    return {
        status: false,
        code,
        message,
        messageToShow,
        data,
    };
};

module.exports = {
    successResponse,
    errorResponse,
};
