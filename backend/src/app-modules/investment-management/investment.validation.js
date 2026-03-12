/**
 * investment.validation.js — Joi schemas for investment-management
 * Source: codegen/schemas/investment.schema.yaml
 */

const Joi = require('joi');

const INVESTMENT_TYPES = ['stock', 'mutual_fund', 'fixed_deposit'];
const STATUSES = ['active', 'closed', 'pending'];

// ── Add Investment ────────────────────────────────────────────────────────────
const addInvestmentSchema = Joi.object({
  investment_type: Joi.string().valid(...INVESTMENT_TYPES).required(),
  amount: Joi.number().min(1).required(),
  expected_return: Joi.number().min(0).optional(),
  current_value: Joi.number().min(0).optional(),
  status: Joi.string().valid(...STATUSES).optional().default('active'),
  invested_at: Joi.date().optional(),
  notes: Joi.string().max(500).optional().allow('', null),
});

// ── Update Investment (PATCH — all optional, min 1 field) ─────────────────────
const updateInvestmentSchema = Joi.object({
  investment_type: Joi.string().valid(...INVESTMENT_TYPES).optional(),
  amount: Joi.number().min(1).optional(),
  expected_return: Joi.number().min(0).optional(),
  current_value: Joi.number().min(0).optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  invested_at: Joi.date().optional(),
  notes: Joi.string().max(500).optional().allow('', null),
}).min(1);

const validate = (data, schema) => schema.validate(data, { abortEarly: false });

module.exports = { addInvestmentSchema, updateInvestmentSchema, validate };
