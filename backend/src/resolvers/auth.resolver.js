'use strict';

/**
 * src/resolvers/auth.resolver.js
 * Authentication resolvers — registerUser and loginUser.
 * Returns a signed JWT + user record on success.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { connectDB }   = require('../config/db');
const { createLogger } = require('../utils/logger');
const {
  handleError,
  ConflictError,
  AuthError,
  ValidationError,
} = require('../utils/errorHandler');
const { validateCreateUser } = require('../utils/validation');

const logger     = createLogger('resolvers:auth');
const JWT_SECRET = process.env.JWT_SECRET     || 'smartbank_fallback_secret';
const JWT_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get (or register) the User Mongoose model.
 * Reuses the model registered by user.resolver.js if already loaded.
 */
function getUserModel() {
  if (mongoose.models.User) return mongoose.models.User;
  const s = new mongoose.Schema(
    {
      userId:          { type: String, default: uuidv4, unique: true, index: true },
      name:            { type: String, required: true, trim: true },
      email:           { type: String, required: true, unique: true, lowercase: true },
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
  return mongoose.model('User', s);
}

/**
 * Build a JWT payload compatible with the context.js parser.
 * Shape mirrors Cognito claims so extractIdentity() works without changes.
 */
function buildToken(user) {
  return jwt.sign(
    {
      sub:             user.userId,
      username:        user.userId,
      name:            user.name,
      email:           user.email,
      'custom:role':   user.role || 'USER',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Strip password and return a plain object safe to return to the client.
 */
function sanitizeUser(doc) {
  const obj = { ...doc };
  delete obj.password;
  // Ensure id virtual for the GraphQL User.id field resolver
  if (!obj.id && obj._id) obj.id = obj._id.toString();
  return obj;
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

const authResolver = {
  Mutation: {
    /**
     * registerUser(input: RegisterUserInput!): AuthPayload!
     * Public — creates account and immediately returns a signed JWT.
     */
    registerUser: async (_parent, { input }) => {
      try {
        // Reuse the createUser validation schema (same fields)
        const data = validateCreateUser({ ...input, role: 'USER' });

        await connectDB();
        const User = getUserModel();

        const existing = await User.findOne({ email: data.email }).lean();
        if (existing) {
          throw new ConflictError(`Email '${data.email}' is already registered`);
        }

        const passwordHash = await bcrypt.hash(data.password, 12);
        const newUser = await User.create({
          ...data,
          password: passwordHash,
          userId: uuidv4(),
        });

        const userObj = sanitizeUser(newUser.toObject());
        const token   = buildToken(userObj);

        logger.info('registerUser resolved', { userId: userObj.userId, email: userObj.email });
        return { token, user: userObj };
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },

    /**
     * loginUser(email: String!, password: String!): AuthPayload!
     * Public — validates credentials and returns a signed JWT.
     */
    loginUser: async (_parent, { email, password }) => {
      try {
        if (!email || !password) {
          throw new ValidationError('Validation failed', [
            ...(!email    ? [{ field: 'email',    message: 'Email is required'    }] : []),
            ...(!password ? [{ field: 'password', message: 'Password is required' }] : []),
          ]);
        }

        await connectDB();
        const User = getUserModel();

        // Explicitly include password (it's select:false by default)
        const user = await User.findOne({
          email: email.toLowerCase().trim(),
          status: { $ne: 'DELETED' },
        }).select('+password').lean();

        if (!user) {
          // Generic message — don't leak whether email exists
          throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
        }

        if (user.status === 'INACTIVE') {
          throw new AuthError('Account is suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
        }

        const userObj = sanitizeUser(user);
        const token   = buildToken(userObj);

        logger.info('loginUser resolved', { userId: userObj.userId, email: userObj.email, role: userObj.role });
        return { token, user: userObj };
      } catch (err) {
        const f = handleError(err);
        throw Object.assign(new Error(f.message), { extensions: f.extensions });
      }
    },
  },
};

module.exports = authResolver;
