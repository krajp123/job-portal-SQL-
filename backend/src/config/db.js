require('dotenv').config();
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;
const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: databaseUrl.includes('sslmode=require') ? {
      ssl: { require: true, rejectUnauthorized: false },
    } : {},
  })
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );

const connectDB = async () => {
  try {
    [
      'Admin', 'AdminAuditLog', 'AdminNotification', 'AdminSession', 'Application',
      'Candidate', 'CandidatePerformanceEvent', 'ChatPreference', 'DeliveryLog',
      'Dispute', 'HelpCenterReport', 'Job', 'JobReopenRequest', 'JobReport',
      'Message', 'Notification', 'OfferLetter', 'Payment', 'PendingCandidateRegistration',
      'PlatformSettings', 'Recruiter', 'Referral', 'Wallet', 'WalletPlan',
    ].forEach((model) => require(`../models/${model}`));
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('PostgreSQL (Neon) connected successfully');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    throw error;
  }
};

module.exports = { sequelize, connectDB };