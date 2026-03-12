/**
 * forex.validation.js — Joi schemas for forex-management
 * Source: codegen/schemas/forex.schema.yaml
 */

const Joi = require('joi');

const TRANSFER_STATUSES = ['initiated', 'completed', 'failed', 'cancelled'];

// Currency code — 3-letter ISO 4217
const currencyCode = Joi.string().length(3).uppercase().required().messages({
  'string.length': 'Currency code must be exactly 3 characters (e.g. USD, INR)',
});

// ── Initiate Transfer ─────────────────────────────────────────────────────────
const initiateTransferSchema = Joi.object({
  amount: Joi.number().min(1).required().messages({
    'number.min': 'Transfer amount must be at least 1',
  }),
  from_currency: currencyCode,
  to_currency: currencyCode,
  exchange_rate: Joi.number().min(0).required(),
  notes: Joi.string().max(300).optional().allow('', null),
});

// ── Admin Status Update ───────────────────────────────────────────────────────
const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...TRANSFER_STATUSES).required(),
});

const validate = (data, schema) => schema.validate(data, { abortEarly: false });

module.exports = { initiateTransferSchema, updateStatusSchema, validate };
