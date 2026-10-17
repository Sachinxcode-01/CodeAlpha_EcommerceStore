const app = require('./app');
const config = require('./config/env');
const db = require('./database/db');

// Ensure database connection is active
try {
  const check = db.prepare('SELECT 1 as connected').get();
  if (check && check.connected === 1) {
    console.log('📦 SQLite database connected with WAL mode and foreign keys enabled.');
  }
} catch (err) {
  console.error('❌ Failed to connect to database:', err);
  process.exit(1);
}

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CodeAlpha E-commerce Store Server running!`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`📚 API Endpoint: http://localhost:${config.port}/api/v1`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);
  server.close(() => {
    console.log('🔒 HTTP server closed.');
    try {
      db.close();
      console.log('📦 Database connection closed.');
    } catch (err) {
      console.error('Error closing database:', err);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
