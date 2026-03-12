'use strict';

/**
 * core/db/index.js
 * MongoDB connection manager using Mongoose.
 * Implements a singleton connection with Lambda-optimized keep-alive.
 */

const mongoose = require('mongoose');
const { createLogger } = require('../logger');

const logger = createLogger('core:db');

/** @type {mongoose.Connection | null} */
let connection = null;

// Read at call time (not module load time) so dotenv is already applied
function getConnectOptions() {
  return {
    dbName: process.env.MONGODB_DB_NAME || 'smartbankai',
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    w: 'majority',
  };
}

/**
 * Connect to MongoDB. Reuses existing connection for warm Lambda invocations.
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDB() {
  // Reuse any existing mongoose connection (incl. one made by src/shared/db.js)
  if (mongoose.connection.readyState === 1) {
    if (!connection) connection = mongoose.connection;
    logger.debug('Reusing existing MongoDB connection');
    return connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const dbName = process.env.MONGODB_DB_NAME || 'smartbankai';

  try {
    logger.info('Establishing MongoDB connection', { db: dbName });

    // Prevent buffering timeouts in Lambda
    mongoose.set('bufferCommands', false);

    await mongoose.connect(uri, getConnectOptions());
    connection = mongoose.connection;

    connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      connection = null;
    });

    connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
      connection = null;
    });

    logger.info(`MongoDB connected: ${connection.host}`, { db: dbName });
    return connection;
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err.message });
    connection = null;
    throw err;
  }
}

/**
 * Get the active MongoDB connection
 * @returns {mongoose.Connection}
 */
function getDB() {
  if (!connection || mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return connection;
}

/**
 * Close the MongoDB connection (useful for graceful shutdown)
 * @returns {Promise<void>}
 */
async function closeDB() {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
    logger.info('MongoDB connection closed');
  }
}

/**
 * Health check — returns connection state
 * @returns {{ status: string, readyState: number }}
 */
function healthCheck() {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const readyState = mongoose.connection.readyState;
  return { status: states[readyState] || 'unknown', readyState };
}

module.exports = { connectDB, getDB, closeDB, healthCheck };
