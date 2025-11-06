const logger = {
  info: (message) => console.log(`[${new Date().toISOString()}] [INFO] ${message}`),
  warn: (message) => console.warn(`[${new Date().toISOString()}] [WARN] ${message}`),
  error: (message, error) => console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, error || ''),
  debug: (message) => console.log(`[${new Date().toISOString()}] [DEBUG] ${message}`)
};

module.exports = logger;
