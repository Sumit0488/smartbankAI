/**
 * expense.validation.js — Auto-generated + patched for Expense entity
 * Source: codegen/schemas/expense.schema.yaml
 */

const Joi = require('joi');

// ── Add Expense ────────────────────────────────────────────────────────────────
const addExpenseSchema = Joi.object({
  user_id: Joi.string().required(),
  category: Joi.string().valid('food', 'travel', 'shopping', 'rent', 'other').default('other'),
  amount: Joi.number().min(0).required(),
  month: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).optional().messages({
    'string.pattern.base': '"month" must be in YYYY-MM format (e.g. 2026-03)',
  }),
  description: Joi.string().max(300).optional().allow('', null),
});

// ── Update Expense (all optional — PATCH semantics) ──────────────────────────
const updateExpenseSchema = Joi.object({
  category: Joi.string().valid('food', 'travel', 'shopping', 'rent', 'other').optional(),
  amount: Joi.number().min(0).optional(),
  month: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  description: Joi.string().max(300).optional().allow('', null),
}).min(1);

const validate = (data, schema) => schema.validate(data, { abortEarly: false });

module.exports = { addExpenseSchema, updateExpenseSchema, validate };
