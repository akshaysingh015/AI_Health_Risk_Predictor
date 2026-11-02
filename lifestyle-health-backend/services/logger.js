const write = (level, message, fields = {}) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...fields
    }));
};

const logger = {
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields)
};

module.exports = logger;
