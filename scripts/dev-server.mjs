#!/usr/bin/env node
// Starts `next dev` on the harness-assigned PORT, falling back to 3003 for a
// manual `npm run dev`. Single source of truth for the dev port so the preview
// harness can pick a free port when 3003 is taken by another session — see
// .claude/launch.json ("autoPort").
//
// Next.js requires Node >=20.9.0. The harness may launch this script with an
// older `node` on PATH (e.g. a system Node 18), which would make the spawned
// `next` fail its engine check. So before spawning, we ensure a Node >=20 is
// first on PATH — discovering one from common version managers if the current
// one is too old — without touching the user's global setup.

import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const MIN_MAJOR = 20;

function majorOf(version) {
  const m = /^v?(\d+)\./.exec(version);
  return m ? Number(m[1]) : 0;
}

// Directories that may contain a `node` binary from a version manager or
// package manager. We expand globs manually to avoid a shell dependency.
function candidateBinDirs() {
  const home = homedir();
  const dirs = [];
  const pushChildrenBins = (root, suffix = 'bin') => {
    if (!existsSync(root)) return;
    for (const entry of readdirSync(root)) {
      dirs.push(path.join(root, entry, suffix));
    }
  };
  // nvm
  pushChildrenBins(path.join(home, '.nvm', 'versions', 'node'));
  // fnm
  pushChildrenBins(path.join(home, '.fnm', 'node-versions'), path.join('installation', 'bin'));
  pushChildrenBins(path.join(home, '.local', 'state', 'fnm_multishells'));
  // volta
  pushChildrenBins(path.join(home, '.volta', 'tools', 'image', 'node'));
  // homebrew / system
  dirs.push('/opt/homebrew/bin', '/usr/local/bin');
  for (const base of ['/opt/homebrew/opt', '/usr/local/opt']) {
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      if (entry.startsWith('node')) dirs.push(path.join(base, entry, 'bin'));
    }
  }
  return dirs;
}

// Returns the bin dir of the newest Node >=MIN_MAJOR we can find, or null.
function findModernNodeBinDir() {
  let best = null;
  for (const dir of candidateBinDirs()) {
    const bin = path.join(dir, 'node');
    if (!existsSync(bin)) continue;
    let version;
    try {
      version = execFileSync(bin, ['-v'], { encoding: 'utf8' }).trim();
    } catch {
      continue;
    }
    const major = majorOf(version);
    if (major < MIN_MAJOR) continue;
    if (!best || major > best.major) best = { dir, major };
  }
  return best?.dir ?? null;
}

const env = { ...process.env };

if (majorOf(process.versions.node) < MIN_MAJOR) {
  const modernBinDir = findModernNodeBinDir();
  if (!modernBinDir) {
    console.error(
      `Next.js requires Node >=${MIN_MAJOR}.9.0, but this script is running on ` +
        `Node ${process.versions.node} and no newer Node was found on this machine.\n` +
        `Install Node ${MIN_MAJOR}+ (e.g. \`nvm install ${MIN_MAJOR}\`) and retry.`
    );
    process.exit(1);
  }
  // Prepend so the spawned `next` (shebang: #!/usr/bin/env node) resolves here.
  env.PATH = `${modernBinDir}${path.delimiter}${env.PATH ?? ''}`;
  console.log(`[dev-server] Using Node from ${modernBinDir} (was ${process.versions.node})`);
}

const port = String(process.env.PORT || 3003);

const child = spawn('next', ['dev', '-p', port], {
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
