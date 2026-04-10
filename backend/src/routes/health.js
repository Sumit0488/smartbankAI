'use strict';
const { Router } = require('express');
const { healthCheck } = require('../config/db');

const router = Router();

router.get('/health', async (_req, res) => {
  const dbState = await healthCheck();
  res.json({
    status: 'ok',
    service: 'SmartBankAI Backend',
    timestamp: new Date().toISOString(),
    db: dbState === 1 ? 'connected' : 'disconnected',
  });
});

module.exports = router;
