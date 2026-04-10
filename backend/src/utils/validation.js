'use strict';

/**
 * src/utils/validation.js
 * Input validation using Joi.
 * Provides schemas and a generic validate() helper.
 */

const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

// ─── Reusable Field Schemas ───────────────────────────────────────────────────

const fields = {
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().max(254),
  password: Joi.string().min(8).max(128)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'digit')
    .pattern(/[^A-Za-z0-9]/, 'symbol'),
  name: Joi.string().min(2).max(100).trim(),
  phone: Joi.string().pattern(/^\+[1-9]\d{6,14}$/).messages({
    'string.pattern.base': 'Phone must be in E.164 format, e.g. +919876543210',
  }),
  userId: Joi.string().uuid({ version: 'uuidv4' }),
  mongoId: Joi.string().hex().length(24),
  positiveNumber: Joi.number().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

// ─── User Schemas ─────────────────────────────────────────────────────────────

const createUserSchema = Joi.object({
  name: fields.name.required(),
  email: fields.email.required(),
  password: fields.password.required(),
  phone: fields.phone.optional(),
  role: Joi.string().valid('ADMIN', 'USER').default('USER'),
  salary: Joi.number().min(0).default(0),
  profileType: Joi.string()
    .valid('STUDENT', 'WORKING_PROFESSIONAL', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'OTHER')
    .default('OTHER'),
});

const updateUserSchema = Joi.object({
  // Core
  name:        fields.name.optional(),
  phone:       fields.phone.optional(),
  salary:      Joi.number().min(0).optional(),
  profileType: Joi.string()
    .valid('STUDENT', 'WORKING_PROFESSIONAL', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'OTHER')
    .optional(),

  // Profile Information
  profileImage: Joi.string().uri().max(512).optional(),
  dateOfBirth:  Joi.string().isoDate().optional(),
  gender:       Joi.string().valid('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY').optional(),
  address: Joi.object({
    street:  Joi.string().max(200).optional(),
    city:    Joi.string().max(100).optional(),
    state:   Joi.string().max(100).optional(),
    pincode: Joi.string().max(20).optional(),
  }).optional(),
  country: Joi.string().max(100).optional(),

  // Financial Profile
  monthlyIncome:  Joi.number().min(0).optional(),
  monthlyBudget:  Joi.number().min(0).optional(),
  riskProfile:    Joi.string().valid('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE').optional(),
  investmentGoal: Joi.string()
    .valid('WEALTH_CREATION', 'RETIREMENT', 'EDUCATION', 'HOME', 'EMERGENCY_FUND', 'OTHER')
    .optional(),

  // Banking Preferences
  preferredBank:   Joi.string().max(100).optional(),
  defaultCurrency: Joi.string().max(10).optional(),
  language:        Joi.string().max(10).optional(),
  notificationPreferences: Joi.object({
    email: Joi.boolean().optional(),
    sms:   Joi.boolean().optional(),
    push:  Joi.boolean().optional(),
  }).optional(),

  // AI Personalization
  aiInsightsEnabled:    Joi.boolean().optional(),
  spendingPattern:      Joi.string().valid('FRUGAL', 'MODERATE', 'LAVISH').optional(),
  investmentPreference: Joi.string()
    .valid('STOCKS', 'MUTUAL_FUNDS', 'FD', 'REAL_ESTATE', 'CRYPTO', 'MIXED')
    .optional(),

  // Budget Settings
  budgetSettings: Joi.object({
    monthlyBudget: Joi.number().min(0).optional(),
    categories: Joi.object({
      food:          Joi.number().min(0).optional(),
      travel:        Joi.number().min(0).optional(),
      entertainment: Joi.number().min(0).optional(),
    }).optional(),
  }).optional(),

  // Investment Profile (user-set preferences; recommendedAssets is auto-calculated)
  investmentProfile: Joi.object({
    riskLevel:      Joi.string().valid('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE').optional(),
    investmentGoal: Joi.string()
      .valid('WEALTH_CREATION', 'RETIREMENT', 'EDUCATION', 'HOME', 'EMERGENCY_FUND', 'OTHER')
      .optional(),
  }).optional(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

// ─── Loan Schemas ─────────────────────────────────────────────────────────────

const applyLoanSchema = Joi.object({
  loanType: Joi.string().valid('HOME', 'CAR', 'PERSONAL', 'EDUCATION').required(),
  loanAmount: Joi.number().min(1000).max(100_000_000).required(),
  interestRate: Joi.number().min(0.01).max(100).required(),
  tenure: Joi.number().integer().min(1).max(360).required(),
  bankName: Joi.string().max(100).optional(),
  notes: Joi.string().max(500).optional(),
});

const updateLoanSchema = Joi.object({
  loanAmount: Joi.number().min(1000).max(100_000_000).optional(),
  interestRate: Joi.number().min(0.01).max(100).optional(),
  tenure: Joi.number().integer().min(1).max(360).optional(),
  bankName: Joi.string().max(100).optional(),
  notes: Joi.string().max(500).optional(),
}).min(1);

// ─── Investment Schemas ───────────────────────────────────────────────────────

const createInvestmentSchema = Joi.object({
  investmentType: Joi.string().valid('STOCK', 'MUTUAL_FUND', 'FIXED_DEPOSIT', 'PF', 'SIP').required(),
  amount: Joi.number().min(1).max(100_000_000).required(),
  expectedReturn: Joi.number().min(0).max(100).optional(),
  currentValue: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
});

const updateInvestmentSchema = Joi.object({
  amount: Joi.number().min(1).max(100_000_000).optional(),
  expectedReturn: Joi.number().min(0).max(100).optional(),
  currentValue: Joi.number().min(0).optional(),
  status: Joi.string().valid('ACTIVE', 'CLOSED', 'PENDING').optional(),
  notes: Joi.string().max(500).optional(),
}).min(1);

// ─── Pagination Schema ────────────────────────────────────────────────────────

const paginationSchema = Joi.object({
  page: fields.page,
  limit: fields.limit,
});

// ─── Generic Validator ────────────────────────────────────────────────────────

/**
 * Validate data against a Joi schema. Throws ValidationError on failure.
 * @param {Joi.Schema} schema
 * @param {object} data
 * @param {Joi.ValidationOptions} [options]
 * @returns {object} Validated (and possibly transformed) value
 */
function validate(schema, data, options = {}) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
    ...options,
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    throw new ValidationError('Validation failed', details);
  }

  return value;
}

/**
 * Validate user creation input
 * @param {object} input
 * @returns {object}
 */
function validateCreateUser(input) {
  return validate(createUserSchema, input);
}

/**
 * Validate user update input
 * @param {object} input
 * @returns {object}
 */
function validateUpdateUser(input) {
  return validate(updateUserSchema, input);
}

/**
 * Validate loan application input
 * @param {object} input
 * @returns {object}
 */
function validateApplyLoan(input) {
  return validate(applyLoanSchema, input);
}

/**
 * Validate loan update input
 * @param {object} input
 * @returns {object}
 */
function validateUpdateLoan(input) {
  return validate(updateLoanSchema, input);
}

/**
 * Validate investment creation input
 * @param {object} input
 * @returns {object}
 */
function validateCreateInvestment(input) {
  return validate(createInvestmentSchema, input);
}

/**
 * Validate investment update input
 * @param {object} input
 * @returns {object}
 */
function validateUpdateInvestment(input) {
  return validate(updateInvestmentSchema, input);
}

/**
 * Validate pagination params
 * @param {object} params
 * @returns {{ page: number, limit: number }}
 */
function validatePagination(params) {
  return validate(paginationSchema, params || {});
}

module.exports = {
  validate,
  validateCreateUser,
  validateUpdateUser,
  validateApplyLoan,
  validateUpdateLoan,
  validateCreateInvestment,
  validateUpdateInvestment,
  validatePagination,
  schemas: {
    createUserSchema,
    updateUserSchema,
    applyLoanSchema,
    updateLoanSchema,
    createInvestmentSchema,
    updateInvestmentSchema,
  },
};
