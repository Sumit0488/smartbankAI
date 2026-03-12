/**
 * backend/src/shared/db.js
 * MongoDB Atlas connection using Mongoose.
 * Singleton pattern — connects once and reuses the connection.
 */

const mongoose = require('mongoose');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('[DB] Already connected to MongoDB Atlas.');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info(`[DB] MongoDB connected: ${connection.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('[DB] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[DB] Disconnected from MongoDB. Attempting to reconnect...');
      isConnected = false;
    });

  } catch (err) {
    logger.error('[DB] Failed to connect to MongoDB Atlas:', err.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('[DB] Disconnected from MongoDB Atlas.');
  }
};

module.exports = { connectDB, disconnectDB };
