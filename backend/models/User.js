'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    userId:          { type: String, default: uuidv4, unique: true, index: true },
    name:            { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, index: true },
    password:        { type: String, required: true, select: false },
    phone:           { type: String },
    role:            { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    salary:          { type: Number, min: 0, default: 0 },
    profileType:     { type: String, enum: ['STUDENT', 'WORKING_PROFESSIONAL', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'OTHER'], default: 'OTHER' },
    isEmailVerified: { type: Boolean, default: false },
    status:          { type: String, enum: ['ACTIVE', 'INACTIVE', 'DELETED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
