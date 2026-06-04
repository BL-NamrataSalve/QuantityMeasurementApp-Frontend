// Custom logger to mimic backend log4j2 functionality in frontend
const levels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

// Default log level
const CURRENT_LEVEL = import.meta.env.PROD ? levels.WARN : levels.DEBUG;

const formatMessage = (level, message, ...args) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] - ${message}`;
};

export const logger = {
    debug: (message, ...args) => {
        if (CURRENT_LEVEL <= levels.DEBUG) {
            console.debug(formatMessage('DEBUG', message), ...args);
        }
    },
    info: (message, ...args) => {
        if (CURRENT_LEVEL <= levels.INFO) {
            console.info(formatMessage('INFO', message), ...args);
        }
    },
    warn: (message, ...args) => {
        if (CURRENT_LEVEL <= levels.WARN) {
            console.warn(formatMessage('WARN', message), ...args);
        }
    },
    error: (message, ...args) => {
        if (CURRENT_LEVEL <= levels.ERROR) {
            console.error(formatMessage('ERROR', message), ...args);
        }
    }
};
