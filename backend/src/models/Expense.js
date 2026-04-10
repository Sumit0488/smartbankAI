'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const expenseSchema = new mongoose.Schema(
  {
    expenseId:   { type: String, default: uuidv4, unique: true, index: true },
    userId:      { type: String, required: true, index: true },
    category:    {
      type: String,
      enum: ['FOOD', 'TRANSPORT', 'HOUSING', 'ENTERTAINMENT', 'HEALTHCARE', 'SHOPPING', 'UTILITIES', 'EDUCATION', 'OTHER'],
      required: true,
    },
    amount:      { type: Number, required: true, min: 0 },
    description: { type: String, maxlength: 500 },
    date:        { type: Date, default: Date.now, required: true },
    tags:        [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
