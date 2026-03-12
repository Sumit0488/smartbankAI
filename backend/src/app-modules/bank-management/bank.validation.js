/**
 * bank.validation.js — Joi schemas for bank-management
 * Source: codegen/schemas/bank.schema.yaml
 */

const Joi = require('joi');

// ── Create Bank (Admin) ───────────────────────────────────────────────────────
const createBankSchema = Joi.object({
  bank_name: Joi.string().min(2).max(100).required(),
  minimum_balance: Joi.number().min(0).optional().default(0),
  interest_rate: Joi.number().min(0).max(20).optional(),
  forex_fee: Joi.number().min(0).optional(),
  account_types: Joi.string().optional().allow('', null),
  features: Joi.string().optional().allow('', null),
  rating: Joi.number().min(0).max(5).optional(),
});

// ── Update Bank (PATCH — all optional, min 1 field) ───────────────────────────
const updateBankSchema = Joi.object({
  bank_name: Joi.string().min(2).max(100).optional(),
  minimum_balance: Joi.number().min(0).optional(),
  interest_rate: Joi.number().min(0).max(20).optional(),
  forex_fee: Joi.number().min(0).optional(),
  account_types: Joi.string().optional().allow('', null),
  features: Joi.string().optional().allow('', null),
  rating: Joi.number().min(0).max(5).optional(),
}).min(1);

const validate = (data, schema) => schema.validate(data, { abortEarly: false });

module.exports = { createBankSchema, updateBankSchema, validate };
