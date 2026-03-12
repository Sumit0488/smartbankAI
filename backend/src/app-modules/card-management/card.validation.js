/**
 * card.validation.js — Joi schemas for card-management
 * Source: codegen/schemas/card.schema.yaml
 */

const Joi = require('joi');

const CARD_TYPES = ['credit', 'debit', 'prepaid'];
const CARD_CATEGORIES = ['shopping', 'travel', 'fuel', 'lifestyle', 'business', 'student', 'basic'];

// ── Create Card (Admin) ───────────────────────────────────────────────────────
const createCardSchema = Joi.object({
  bank_name: Joi.string().min(2).max(100).required(),
  card_name: Joi.string().min(2).max(100).required(),
  card_type: Joi.string().valid(...CARD_TYPES).optional().default('credit'),
  annual_fee: Joi.number().min(0).optional().default(0),
  joining_fee: Joi.number().min(0).optional().default(0),
  cashback_rate: Joi.number().min(0).max(100).optional(),
  benefits: Joi.string().optional().allow('', null),
  card_category: Joi.string().valid(...CARD_CATEGORIES).optional(),
  rating: Joi.number().min(0).max(5).optional(),
});

// ── Update Card (PATCH — all optional, min 1 field) ───────────────────────────
const updateCardSchema = Joi.object({
  bank_name: Joi.string().min(2).max(100).optional(),
  card_name: Joi.string().min(2).max(100).optional(),
  card_type: Joi.string().valid(...CARD_TYPES).optional(),
  annual_fee: Joi.number().min(0).optional(),
  joining_fee: Joi.number().min(0).optional(),
  cashback_rate: Joi.number().min(0).max(100).optional(),
  benefits: Joi.string().optional().allow('', null),
  card_category: Joi.string().valid(...CARD_CATEGORIES).optional(),
  rating: Joi.number().min(0).max(5).optional(),
}).min(1);

const validate = (data, schema) => schema.validate(data, { abortEarly: false });

module.exports = { createCardSchema, updateCardSchema, validate };
