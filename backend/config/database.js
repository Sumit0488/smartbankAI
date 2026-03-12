'use strict';

/**
 * config/database.js
 * Thin wrapper — delegates to src/shared/db.js (the primary connection module).
 * Import this from any module that needs to ensure DB connectivity.
 */

const { connectDB, disconnectDB } = require('../src/shared/db');

module.exports = { connectDB, disconnectDB };
