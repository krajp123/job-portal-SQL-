require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const scheduleRenewalReminder = require('./src/jobs/renewalReminder.cron');
const scheduleAccountSuspension = require('./src/jobs/accountSuspension.cron');
const { scheduleWalletCleanup } = require('./src/jobs/walletCleanup.cron');
const scheduleJobPreferenceAlerts = require('./src/jobs/jobPreferenceAlerts.cron');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  scheduleRenewalReminder();
  scheduleAccountSuspension();
  scheduleWalletCleanup();
  scheduleJobPreferenceAlerts();

  // Use a raw http server (instead of app.listen) so Socket.io can share the
  // same port as the REST API.
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    // Server started successfully
  });
}

start();