'use strict';

/**
 * graphql/resolvers/index.js
 * Merges all module resolvers into a single resolver map for Apollo Server.
 */

const { Kind } = require('graphql');

const authResolver       = require('./auth.resolver');
const userResolver       = require('./user.resolver');
const adminResolver      = require('./admin.resolver');
const loanResolver       = require('./loan.resolver');
const investmentResolver = require('./investment.resolver');
const expenseResolver    = require('./expense.resolver');
const cardResolver       = require('./card.resolver');
const forexResolver      = require('./forex.resolver');
const bankResolver       = require('./bank.resolver');

// ─── Custom Scalar Resolvers ──────────────────────────────────────────────────

const scalarResolvers = {
  DateTime: {
    serialize:    (value) => (value instanceof Date ? value.toISOString() : String(value)),
    parseValue:   (value) => new Date(value),
    parseLiteral: (ast)   => new Date(ast.value),
  },
  JSON: {
    serialize:    (value) => value,
    parseValue:   (value) => value,
    parseLiteral: (ast) => {
      switch (ast.kind) {
        case Kind.STRING:  return ast.value;
        case Kind.INT:     return parseInt(ast.value, 10);
        case Kind.FLOAT:   return parseFloat(ast.value);
        case Kind.BOOLEAN: return ast.value;
        case Kind.NULL:    return null;
        default:           return null;
      }
    },
  },
};

// ─── Deep-merge two resolver maps ────────────────────────────────────────────

function mergeResolvers(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (result[key] && typeof result[key] === 'object' && typeof source[key] === 'object') {
      result[key] = { ...result[key], ...source[key] };
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ─── Health Check Resolver ───────────────────────────────────────────────────

const healthResolver = {
  Query: {
    healthCheck: () => ({
      status:    'ok',
      service:   'SmartBank AI GraphQL API',
      timestamp: new Date().toISOString(),
      version:   process.env.npm_package_version || '2.0.0',
    }),
  },
};

const resolvers = [
  scalarResolvers,
  authResolver,
  userResolver,
  adminResolver,
  loanResolver,
  investmentResolver,
  expenseResolver,
  cardResolver,
  forexResolver,
  bankResolver,
  healthResolver,
].reduce((acc, r) => mergeResolvers(acc, r), {});

module.exports = resolvers;
