/**
 * scripts/kill-port.js
 * Cross-platform script that kills any process occupying PORT before the dev
 * server starts. Run via: node scripts/kill-port.js [port]
 * Used automatically by "npm run dev" in package.json.
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const net = require('net');

require('dotenv').config();

const PORT = parseInt(process.argv[2] || process.env.PORT || '4000', 10);

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(err.code === 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

function getPidOnPort(port) {
  try {
    if (process.platform === 'win32') {
      // PowerShell: Get-NetTCPConnection
      const result = spawnSync('powershell', [
        '-NoProfile', '-NonInteractive', '-Command',
        `(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)`,
      ], { encoding: 'utf8' });
      const pid = parseInt((result.stdout || '').trim(), 10);
      return isNaN(pid) ? null : pid;
    } else {
      // Unix: lsof
      const result = spawnSync('lsof', ['-ti', `:${port}`], { encoding: 'utf8' });
      const pid = parseInt((result.stdout || '').trim(), 10);
      return isNaN(pid) ? null : pid;
    }
  } catch {
    return null;
  }
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGKILL');
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const inUse = await isPortInUse(PORT);
  if (!inUse) {
    console.log(`[kill-port] Port ${PORT} is free — starting server.`);
    process.exit(0);
  }

  console.log(`[kill-port] Port ${PORT} is busy — finding blocking process...`);
  const pid = getPidOnPort(PORT);

  if (!pid) {
    console.error(`[kill-port] Could not determine PID for port ${PORT}.`);
    console.error(`[kill-port] Please run: netstat -ano | findstr :${PORT}  then  taskkill /F /PID <pid>`);
    process.exit(1);
  }

  console.log(`[kill-port] Killing PID ${pid} (was holding port ${PORT})...`);
  const killed = killPid(pid);

  if (killed) {
    console.log(`[kill-port] PID ${pid} killed — port ${PORT} is now free.`);
    // Small delay to let the OS release the port
    await new Promise((r) => setTimeout(r, 800));
    process.exit(0);
  } else {
    console.error(`[kill-port] Failed to kill PID ${pid}. Try manually: taskkill /F /PID ${pid}`);
    process.exit(1);
  }
}

main();
