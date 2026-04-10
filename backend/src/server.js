'use strict';
require('dotenv').config();

// Fix: Node.js defaults to 127.0.0.1:53 which has no DNS listener.
// Override to use Google DNS so MongoDB Atlas SRV lookups work.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const path    = require('path');
const { ApolloServer }      = require('apollo-server-express');
const { mergeTypeDefs }     = require('@graphql-tools/merge');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { loadFilesSync }     = require('@graphql-tools/load-files');

const { connectDB }  = require('./config/db');
const buildContext   = require('./resolvers/context');
const resolvers      = require('./resolvers/index');
const healthRouter   = require('./routes/health');

const schemaDir  = path.join(__dirname, 'schema');
const typeDefs   = mergeTypeDefs(loadFilesSync(path.join(schemaDir, '**/*.graphql')));
const schema     = makeExecutableSchema({ typeDefs, resolvers });

async function runStartupMigration() {
  const mongoose = require('mongoose');
  const db = mongoose.connection;
  const dropIndex = async (coll, idx) => {
    try { await db.collection(coll).dropIndex(idx); } catch (_) {}
  };
  const deleteNulls = async (coll, field) => {
    try { await db.collection(coll).deleteMany({ [field]: null }); } catch (_) {}
  };
  await dropIndex('loans',       'loan_id_1');
  await dropIndex('investments', 'investment_id_1');
  await dropIndex('users',       'user_id_1');
  await deleteNulls('loans',       'loanId');
  await deleteNulls('investments', 'investmentId');
}

async function startServer() {
  // Try DB connection — non-fatal so server starts even if Atlas is temporarily down
  try {
    await connectDB();
    await runStartupMigration();
  } catch (dbErr) {
    console.warn('\n⚠️  MongoDB connection failed at startup:', dbErr.message);
    console.warn('⚠️  Server will start without DB — fix Atlas connection to persist data.\n');
    console.warn('   Fix options:');
    console.warn('   1. Go to MongoDB Atlas → Resume your cluster if it is paused');
    console.warn('   2. Go to Network Access → Add your IP (or 0.0.0.0/0 for dev)');
    console.warn('   3. Or use local MongoDB: set MONGODB_URI=mongodb://localhost:27017/smartbankai\n');
  }

  const app = express();

  const corsOptions = {
    origin: (origin, cb) => {
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return cb(null, true);
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.options('*', cors(corsOptions));
  app.use(express.json());

  app.use((req, _res, next) => {
    if (req.path !== '/health') console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  app.use(healthRouter);

  const server = new ApolloServer({
    schema,
    context: buildContext,
    formatError: (err) => {
      console.error('[GraphQL Error]', err.message, err.path);
      return { message: err.message, path: err.path, code: err.extensions?.code || 'INTERNAL_ERROR' };
    },
    introspection: true,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql', cors: false });

  const PORT = process.env.PORT || 4000;
  const httpServer = app.listen(PORT, () => {
    console.log(`\nSmartBankAI Backend running!`);
    console.log(`  Server:  http://localhost:${PORT}`);
    console.log(`  GraphQL: http://localhost:${PORT}/graphql`);
    console.log(`  Health:  http://localhost:${PORT}/health`);
    console.log(`  Mode:    ${process.env.NODE_ENV || 'development'}\n`);
  });

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use!`);
      process.exit(1);
    }
    throw err;
  });
}

startServer().catch(err => {
  console.error('Server failed to start (non-DB error):', err);
  process.exit(1);
});
