const logger = {
    info: (msg, meta = {}) => {
        console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "INFO", message: msg, ...meta }));
    },
    error: (msg, err = {}, meta = {}) => {
        console.error(JSON.stringify({ 
            timestamp: new Date().toISOString(), 
            level: "ERROR", 
            message: msg, 
            error_message: err ? err.message : null, 
            stack: err ? err.stack : null,
            ...meta 
        }));
    },
    warn: (msg, meta = {}) => {
        console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: "WARN", message: msg, ...meta }));
    }
};

module.exports = logger;
