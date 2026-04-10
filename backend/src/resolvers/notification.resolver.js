'use strict';

/**
 * src/resolvers/notification.resolver.js
 * Handles: notifications and user activity feed
 */

const mongoose = require('mongoose');
const { extractIdentity } = require('../utils/auth');
const { connectDB } = require('../config/db');
const { createLogger } = require('../utils/logger');
const { handleError, AuthError, NotFoundError } = require('../utils/errorHandler');

const logger = createLogger('resolvers:notification');

// ─── Inline Models ────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIdentity(context) {
  const identity = extractIdentity(context.identity);
  if (!identity) throw new AuthError('Authentication required');
  return identity;
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const Query = {
  getNotifications: async (_parent, _args, context) => {
    try {
      const identity = getIdentity(context);
      await connectDB();
      const Notification = getNotificationModel();
      const items = await Notification.find({ userId: identity.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return items.map(n => ({
        ...n,
        id: n._id?.toString(),
        notificationId: n.notificationId,
        type: n.type || 'SYSTEM',
        createdAt: n.createdAt?.toISOString(),
      }));
    } catch (err) {
      return handleError(err);
    }
  },

  getUserActivity: async (_parent, _args, context) => {
    try {
      const identity = getIdentity(context);
      await connectDB();

      const userId = identity.userId;
      const activities = [];

      // Loans
      if (mongoose.models.Loan) {
        const loans = await mongoose.models.Loan.find({ userId })
          .sort({ createdAt: -1 }).limit(5).lean();
        for (const l of loans) {
          activities.push({
            id: l._id?.toString(),
            type: 'LOAN',
            title: 'Loan Application',
            amount: l.loanAmount,
            description: `${l.loanType} loan — ₹${Number(l.loanAmount || 0).toLocaleString('en-IN')}`,
            createdAt: (l.appliedAt || l.createdAt)?.toISOString(),
          });
        }
      }

      // Investments
      if (mongoose.models.Investment) {
        const invs = await mongoose.models.Investment.find({ userId })
          .sort({ createdAt: -1 }).limit(5).lean();
        for (const inv of invs) {
          activities.push({
            id: inv._id?.toString(),
            type: 'INVESTMENT',
            title: 'Investment Created',
            amount: inv.amount,
            description: `${inv.investmentType} — ₹${Number(inv.amount || 0).toLocaleString('en-IN')}`,
            createdAt: (inv.investedAt || inv.createdAt)?.toISOString(),
          });
        }
      }

      // Expenses
      if (mongoose.models.Expense) {
        const exps = await mongoose.models.Expense.find({ userId })
          .sort({ createdAt: -1 }).limit(5).lean();
        for (const e of exps) {
          activities.push({
            id: e._id?.toString(),
            type: 'EXPENSE',
            title: 'Expense Added',
            amount: e.amount,
            description: `${e.category} — ₹${Number(e.amount || 0).toLocaleString('en-IN')}`,
            createdAt: (e.date || e.createdAt)?.toISOString(),
          });
        }
      }

      // Forex Transfers
      if (mongoose.models.ForexTransfer) {
        const fxs = await mongoose.models.ForexTransfer.find({ userId })
          .sort({ createdAt: -1 }).limit(3).lean();
        for (const fx of fxs) {
          activities.push({
            id: fx._id?.toString(),
            type: 'FOREX',
            title: 'Forex Transfer',
            amount: fx.amount,
            description: `${fx.fromCurrency} → ${fx.toCurrency} — ₹${Number(fx.amount || 0).toLocaleString('en-IN')}`,
            createdAt: fx.createdAt?.toISOString(),
          });
        }
      }

      // Card Applications (from notifications)
      const Notification = getNotificationModel();
      const cardNotifs = await Notification.find({ userId, type: 'CARD' })
        .sort({ createdAt: -1 }).limit(3).lean();
      for (const n of cardNotifs) {
        activities.push({
          id: n._id?.toString(),
          type: 'CARD',
          title: 'Card Application',
          amount: null,
          description: n.message,
          createdAt: n.createdAt?.toISOString(),
        });
      }

      // Sort all by date desc and return last 10
      activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return activities.slice(0, 10);
    } catch (err) {
      return handleError(err);
    }
  },
};

const Mutation = {
  markNotificationRead: async (_parent, { notificationId }, context) => {
    try {
      const identity = getIdentity(context);
      await connectDB();
      const Notification = getNotificationModel();
      const notif = await Notification.findOneAndUpdate(
        { notificationId, userId: identity.userId },
        { read: true },
        { new: true }
      ).lean();
      if (!notif) throw new NotFoundError('Notification');
      return {
        ...notif,
        id: notif._id?.toString(),
        type: notif.type || 'SYSTEM',
        createdAt: notif.createdAt?.toISOString(),
      };
    } catch (err) {
      return handleError(err);
    }
  },

  markAllNotificationsRead: async (_parent, _args, context) => {
    try {
      const identity = getIdentity(context);
      await connectDB();
      const Notification = getNotificationModel();
      await Notification.updateMany({ userId: identity.userId, read: false }, { read: true });
      return { success: true, message: 'All notifications marked as read' };
    } catch (err) {
      return handleError(err);
    }
  },
};

module.exports = { Query, Mutation };

