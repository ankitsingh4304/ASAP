const log = (level, message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
};

module.exports = {
  info: (msg) => log('INFO', msg),
  error: (msg) => log('ERROR', msg),
  warn: (msg) => log('WARN', msg),
  debug: (msg) => log('DEBUG', msg)
};
