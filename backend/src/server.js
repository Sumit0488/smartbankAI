/**
 * backend/src/server.js
 * SmartBank AI — Apollo GraphQL + Express server entry point.
 * Loads schemas from graphql/schema/ and resolvers from graphql/resolvers/.
 */

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const { ApolloServer } = require('apollo-server-express');
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { loadFilesSync } = require('@graphql-tools/load-files');
const path = require('path');
const cors = require('cors');
const { connectDB } = require('./shared/db');
const buildContext = require('../graphql/context');


// ── Load GraphQL Type Defs ────────────────────────────────────────────────────
// All .graphql files under graphql/schema/ — shared.graphql is included automatically.

const schemaDir = path.join(__dirname, '..', 'graphql', 'schema');

const typeDefsArray = loadFilesSync(path.join(schemaDir, '**/*.graphql'));
const typeDefs = mergeTypeDefs(typeDefsArray);

// ── Load Resolvers ────────────────────────────────────────────────────────────
// graphql/resolvers/index.js merges all module resolvers + scalar resolvers.

const resolvers = require('../graphql/resolvers/index');

// ── Build Schema ──────────────────────────────────────────────────────────────

const schema = makeExecutableSchema({ typeDefs, resolvers });

// ── Apollo Server ─────────────────────────────────────────────────────────────

/**
 * One-time startup migration:
 * Drops old snake_case unique indexes (loan_id, investment_id) left by the
 * legacy app-modules models, and removes any null-key orphan documents that
 * would block new camelCase inserts.
 */
async function runStartupMigration() {
  const mongoose = require('mongoose');
  const db = mongoose.connection;

  const dropIndex = async (collName, indexName) => {
    try {
      await db.collection(collName).dropIndex(indexName);
      console.log(`   [migration] Dropped old index "${indexName}" on ${collName}`);
    } catch (_) { /* index doesn't exist — that's fine */ }
  };

  const deleteNulls = async (collName, field) => {
    try {
      const r = await db.collection(collName).deleteMany({ [field]: null });
      if (r.deletedCount > 0) console.log(`   [migration] Removed ${r.deletedCount} null-${field} doc(s) from ${collName}`);
    } catch (_) {}
  };

  // Drop legacy snake_case unique indexes
  await dropIndex('loans',       'loan_id_1');
  await dropIndex('investments', 'investment_id_1');
  await dropIndex('users',       'user_id_1');

  // Remove orphan null-key documents so unique indexes stay clean
  await deleteNulls('loans',       'loanId');
  await deleteNulls('investments', 'investmentId');
}

const startServer = async () => {
  await connectDB();
  await runStartupMigration();

  const app = express();

  // ── CORS — allow all localhost origins in dev ─────────────────────────────
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman) or any localhost origin
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  // Handle OPTIONS preflight for ALL routes (required for Apollo GraphQL)
  app.options('*', cors(corsOptions));

  app.use(express.json());

  // ── Request Logger ─────────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    const ts = new Date().toISOString();
    if (req.path !== '/health') {                   // skip noisy health pings
      console.log(`[${ts}] ${req.method} ${req.path}`);
    }
    next();
  });


  // Health check
  app.get('/health', (_, res) => res.json({
    status: 'ok',
    service: 'SmartBank AI Backend',
    timestamp: new Date().toISOString(),
  }));

  const server = new ApolloServer({
    schema,
    context: buildContext,
    formatError: (err) => {
      console.error('[GraphQL Error]', err.message, err.path);
      return {
        message: err.message,
        path: err.path,
        code: err.extensions?.code || 'INTERNAL_ERROR',
      };
    },
    introspection: true,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql', cors: false });

  const PORT = process.env.PORT || 4000;
  const httpServer = app.listen(PORT, () => {
    console.log(`\n🚀  SmartBank AI Backend running!`);
    console.log(`   Server:  http://localhost:${PORT}`);
    console.log(`   GraphQL: http://localhost:${PORT}/graphql`);
    console.log(`   Health:  http://localhost:${PORT}/health`);
    console.log(`   Mode:    ${process.env.NODE_ENV || 'development'}\n`);
    console.log(`   Schema:  ${typeDefsArray.length} type def files loaded`);
    console.log(`   Resolvers: graphql/resolvers/index.js (5 modules merged)\n`);
  });

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌  Port ${PORT} is already in use!`);
      console.error(`   Windows: netstat -ano | findstr :${PORT}  →  taskkill /F /PID <pid>`);
      console.error(`   Mac/Linux: lsof -ti:${PORT} | xargs kill`);
      console.error(`   Or set a different PORT= in your .env file\n`);
      process.exit(1);
    }
    throw err;
  });
};

startServer().catch(err => {
  console.error('❌  Server failed to start:', err);
  process.exit(1);
});
