// utils/logger.js
const logger = {
    info: (message) => console.log(message),
    error: (message, error) => console.error(message, error),
    warn: (message) => console.warn(message),
    debug: (message) => console.debug(message)
};

module.exports = logger;