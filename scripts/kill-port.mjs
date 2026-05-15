#!/usr/bin/env node
// Frees a TCP port by terminating any process currently listening on it.
// Cross-platform (Windows / macOS / Linux). Silent no-op when port is free.
// Usage:  node scripts/kill-port.mjs [port]   (default: 3003)

import { execSync } from 'node:child_process';

const port = Number(process.argv[2] ?? 3003);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`[kill-port] invalid port: ${process.argv[2]}`);
  process.exit(1);
}

const isWindows = process.platform === 'win32';

function findPidsWindows(p) {
  let out = '';
  try {
    out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
  } catch {
    return [];
  }
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue;
    // columns:  Proto  Local  Foreign  State  PID
    const cols = line.trim().split(/\s+/);
    const local = cols[1] ?? '';
    const pid = cols[cols.length - 1];
    // Match :PORT at end of local address (handles 0.0.0.0:3003 and [::]:3003)
    if (new RegExp(`:${p}$`).test(local) && /^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }
  return [...pids];
}

function findPidsUnix(p) {
  try {
    const out = execSync(`lsof -tiTCP:${p} -sTCP:LISTEN`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split(/\s+/).filter(Boolean);
  } catch {
    return [];
  }
}

const pids = isWindows ? findPidsWindows(port) : findPidsUnix(port);

if (pids.length === 0) {
  process.exit(0);
}

for (const pid of pids) {
  try {
    if (isWindows) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    console.log(`[kill-port] freed port ${port} (killed pid ${pid})`);
  } catch (err) {
    console.warn(`[kill-port] could not kill pid ${pid}: ${err.message}`);
  }
}
