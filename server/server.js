const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback to root if present

const app = require('./app');
const connectDB = require('./config/db');
const { initCronScheduler } = require('./services/cronService');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().then(() => {
  // Initialize automated due-date node-cron scheduler
  initCronScheduler();

  // Start HTTP Server
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` SMART LIBRARY MANAGEMENT SYSTEM - SERVER API `);
    console.log(` Status: Running on port ${PORT}`);
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(` Timezone: ${process.env.TIMEZONE || 'Asia/Kolkata'}`);
    console.log(`===============================================`);
  });
}).catch((err) => {
  console.error('[Server startup failed]:', err);
});

