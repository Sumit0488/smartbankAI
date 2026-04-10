'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, default: uuidv4, unique: true, index: true },
    userId:         { type: String, required: true, index: true },
    type:           { type: String, enum: ['LOAN', 'INVESTMENT', 'EXPENSE', 'CARD', 'FOREX', 'SYSTEM', 'OTP'], default: 'SYSTEM' },
    title:          { type: String, required: true },
    message:        { type: String, required: true },
    read:           { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
