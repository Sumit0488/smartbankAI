'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const addressSchema = new mongoose.Schema(
  {
    street:  { type: String, maxlength: 200 },
    city:    { type: String, maxlength: 100 },
    state:   { type: String, maxlength: 100 },
    pincode: { type: String, maxlength: 20 },
  },
  { _id: false }
);

const notificationPreferencesSchema = new mongoose.Schema(
  {
    email: { type: Boolean, default: true },
    sms:   { type: Boolean, default: false },
    push:  { type: Boolean, default: true },
  },
  { _id: false }
);

const userFinancialSummarySchema = new mongoose.Schema(
  {
    totalIncome:          { type: Number, default: 0, min: 0 },
    totalExpenses:        { type: Number, default: 0, min: 0 },
    totalInvestments:     { type: Number, default: 0, min: 0 },
    totalSavings:         { type: Number, default: 0 },
    monthlySavingsRate:   { type: Number, default: 0 },
    financialHealthScore: { type: Number, default: 0, min: 0, max: 100 },
    lastCalculated:       { type: Date },
  },
  { _id: false }
);

const aiInsightsSchema = new mongoose.Schema(
  {
    topSpendingCategory: { type: String },
    highestExpenseMonth: { type: String },
    savingsSuggestion:   { type: String },
    riskAlert:           { type: String },
  },
  { _id: false }
);

const budgetCategoriesSchema = new mongoose.Schema(
  {
    food:          { type: Number, min: 0, default: 0 },
    travel:        { type: Number, min: 0, default: 0 },
    entertainment: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const budgetSettingsSchema = new mongoose.Schema(
  {
    monthlyBudget: { type: Number, min: 0, default: 0 },
    categories:    { type: budgetCategoriesSchema, default: () => ({}) },
  },
  { _id: false }
);

const investmentProfileSchema = new mongoose.Schema(
  {
    riskLevel:         { type: String, enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'], default: 'MODERATE' },
    recommendedAssets: [{ type: String }],
    investmentGoal:    {
      type: String,
      enum: ['WEALTH_CREATION', 'RETIREMENT', 'EDUCATION', 'HOME', 'EMERGENCY_FUND', 'OTHER'],
      default: 'OTHER',
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // ── Core Identity ────────────────────────────────────────────────────────
    userId:      { type: String, default: uuidv4, unique: true, index: true },
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password:    { type: String, required: true, select: false },
    role:        { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    status:      { type: String, enum: ['ACTIVE', 'INACTIVE', 'DELETED'], default: 'ACTIVE' },
    profileType: {
      type: String,
      enum: ['STUDENT', 'WORKING_PROFESSIONAL', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'OTHER'],
      default: 'OTHER',
    },

    // ── Profile Information ──────────────────────────────────────────────────
    phone:        { type: String },
    profileImage: { type: String, maxlength: 512 },
    dateOfBirth:  { type: Date },
    gender:       {
      type: String,
      enum: ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'],
    },
    address:  { type: addressSchema },
    country:  { type: String, default: 'India', maxlength: 100 },

    // ── Security & Authentication ────────────────────────────────────────────
    lastLogin:         { type: Date },
    loginAttempts:     { type: Number, default: 0, select: false },
    accountLocked:     { type: Boolean, default: false },
    twoFactorEnabled:  { type: Boolean, default: false },
    passwordChangedAt: { type: Date, select: false },

    // ── Financial Profile ────────────────────────────────────────────────────
    salary:         { type: Number, min: 0, default: 0 },   // kept for backward compat
    monthlyIncome:  { type: Number, min: 0, default: 0 },
    monthlyBudget:  { type: Number, min: 0, default: 0 },
    riskProfile:    {
      type: String,
      enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
      default: 'MODERATE',
    },
    investmentGoal: {
      type: String,
      enum: ['WEALTH_CREATION', 'RETIREMENT', 'EDUCATION', 'HOME', 'EMERGENCY_FUND', 'OTHER'],
      default: 'OTHER',
    },
    creditScore: { type: Number, min: 300, max: 900 },

    // ── Banking Preferences ──────────────────────────────────────────────────
    preferredBank:             { type: String, maxlength: 100 },
    defaultCurrency:           { type: String, default: 'INR', maxlength: 10 },
    language:                  { type: String, default: 'en', maxlength: 10 },
    notificationPreferences:   { type: notificationPreferencesSchema, default: () => ({}) },

    // ── AI Personalization ───────────────────────────────────────────────────
    aiInsightsEnabled:    { type: Boolean, default: true },
    spendingPattern:      { type: String, enum: ['FRUGAL', 'MODERATE', 'LAVISH'] },
    investmentPreference: {
      type: String,
      enum: ['STOCKS', 'MUTUAL_FUNDS', 'FD', 'REAL_ESTATE', 'CRYPTO', 'MIXED'],
    },
    financialHealthScore: { type: Number, min: 0, max: 100 },

    // ── KYC Verification ─────────────────────────────────────────────────────
    kycStatus:     {
      type: String,
      enum: ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    panNumber:     { type: String, maxlength: 10, select: false },   // sensitive
    aadhaarNumber: { type: String, maxlength: 12, select: false },   // sensitive
    kycVerifiedAt: { type: Date },

    // ── Financial Analytics (auto-calculated) ────────────────────────────────
    userFinancialSummary: { type: userFinancialSummarySchema, default: () => ({}) },
    aiInsights:           { type: aiInsightsSchema, default: () => ({}) },
    budgetSettings:       { type: budgetSettingsSchema, default: () => ({}) },
    investmentProfile:    { type: investmentProfileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
