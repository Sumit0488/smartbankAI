'use strict';

/**
 * src/utils/createNotification.js
 * Standalone helper to create a notification document in MongoDB.
 * Exported separately so it can be imported by any resolver without
 * being treated as a GraphQL resolver type by graphql-tools.
 */

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { createLogger } = require('./logger');

const logger = createLogger('utils:createNotification');

function getNotificationModel() {
  if (mongoose.models.Notification) return mongoose.models.Notification;
  const { v4: uuidv4 } = require('uuid');
  const schema = new mongoose.Schema(
    {
      notificationId: { type: String, default: uuidv4, unique: true, index: true },
      userId:         { type: String, required: true, index: true },
      type:           { type: String, enum: ['LOAN', 'INVESTMENT', 'EXPENSE', 'CARD', 'FOREX', 'SYSTEM'], default: 'SYSTEM' },
      title:          { type: String, required: true },
      message:        { type: String, required: true },
      read:           { type: Boolean, default: false },
    },
    { timestamps: true }
  );
  return mongoose.model('Notification', schema);
}

/**
 * Create and persist an in-app notification for a user.
 * Fire-and-forget safe — errors are logged, never thrown.
 */
async function createNotification(userId, type, title, message) {
  try {
    await connectDB();
    const Notification = getNotificationModel();
    await Notification.create({ userId, type, title, message });
  } catch (err) {
    logger.warn('Failed to create notification', { userId, type, error: err.message });
  }
}

module.exports = { createNotification };
