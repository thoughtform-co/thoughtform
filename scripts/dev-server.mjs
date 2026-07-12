#!/usr/bin/env node
// Starts `next dev` on the harness-assigned PORT, falling back to 3003 for a
// manual `npm run dev`. Single source of truth for the dev port so the preview
// harness can pick a free port when 3003 is taken by another session — see
// .claude/launch.json ("autoPort").

import { spawn } from 'node:child_process';

const port = String(process.env.PORT || 3003);

const child = spawn('next', ['dev', '-p', port], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
