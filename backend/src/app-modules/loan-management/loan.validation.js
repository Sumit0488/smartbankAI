/**
 * loan.validation.js — Joi schemas for loan-management
 * Source: codegen/schemas/loan.schema.yaml
 */

const Joi = require('joi');

const LOAN_TYPES = ['home', 'car', 'personal', 'education'];
const LOAN_STATUSES = ['pending', 'approved', 'rejected', 'disbursed', 'closed'];

// ── Apply Loan ────────────────────────────────────────────────────────────────
const applyLoanSchema = Joi.object({
  loan_type: Joi.string().valid(...LOAN_TYPES).required(),
  loan_amount: Joi.number().min(1000).required().messages({
    'number.min': 'Minimum loan amount is ₹1,000',
  }),
  interest_rate: Joi.number().min(0).max(100).required(),
  tenure: Joi.number().integer().min(1).required().messages({
    'number.min': 'Tenure must be at least 1 month',
  }),
  bank_name: Joi.string().optional().allow('', null),
  notes: Joi.string().max(500).optional().allow('', null),
});

// ── Update Loan (PATCH — all optional, min 1 field) ───────────────────────────
const updateLoanSchema = Joi.object({
  loan_type: Joi.string().valid(...LOAN_TYPES).optional(),
  loan_amount: Joi.number().min(1000).optional(),
  interest_rate: Joi.number().min(0).max(100).optional(),
  tenure: Joi.number().integer().min(1).optional(),
  bank_name: Joi.string().optional().allow('', null),
  notes: Joi.string().max(500).optional().allow('', null),
}).min(1);

// ── Admin Status Update ───────────────────────────────────────────────────────
const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...LOAN_STATUSES).required(),
});

const validate = (data, schema) => schema.validate(data, { abortEarly: false });

module.exports = { applyLoanSchema, updateLoanSchema, updateStatusSchema, validate };
