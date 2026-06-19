const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/response");

/**
 * JWT Authentication Middleware
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json(
            errorResponse(
                "UNAUTHORIZED",
                "Authorization token missing or malformed.",
                "Access denied. Please log in."
            )
        );
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        // Attach the decoded token payload (which includes id, user_id, role) to the request object
        req.user = decoded;
        
        next();
    } catch (err) {
        let code = "TOKEN_INVALID";
        let message = err.message;
        let messageToShow = "Session invalid. Please log in again.";

        if (err.name === "TokenExpiredError") {
            code = "TOKEN_EXPIRED";
            message = "Access token expired.";
            messageToShow = "Session expired. Please refresh your session.";
        }

        return res.status(401).json(errorResponse(code, message, messageToShow));
    }
};

module.exports = authenticateJWT;
