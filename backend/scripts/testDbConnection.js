'use strict';

/**
 * scripts/testDbConnection.js
 * Tests MongoDB connectivity. Used by precondition checks.
 * Exit 0 on success, 1 on failure.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME     = process.env.MONGODB_DB_NAME || 'smartbankai';

async function test() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    // Ping the server
    await mongoose.connection.db.admin().ping();
    console.log(`MongoDB connection OK — database: ${DB_NAME}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`MongoDB connection FAILED: ${err.message}`);
    process.exit(1);
  }
}

test();
