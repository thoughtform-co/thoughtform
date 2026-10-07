/**
 * design-eval/_client — the one Anthropic client every design-eval script shares.
 *
 * Lifted out of judge.mjs (ADR-149 Phase 1D) so the jury (awwwards.mjs) and the
 * judge build their client the same way: `.env.local` / `.env` read without a
 * dependency, the key named in the error when it is missing, the two default
 * models declared ONCE.
 *
 * ⚠ `loadEnv()` never overrides a variable the shell already set — the file is
 * a fallback, not an authority. Call it before `makeClient()`.
 *
 * ⚠ `makeClient()` THROWS; it does not exit. The scripts own their exit codes
 * (2 = could not run), and a shared module that calls `process.exit` is a
 * module that ends a dry run it was never meant to touch.
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";

/** The stage-2 judge (rubric.md): a fast model at temperature 0. */
export const MODEL_DEFAULT_JUDGE = "claude-haiku-4-5-20251001";

/**
 * The Awwwards jury (awwwards.md): Opus 5.5 with structured output and high
 * effort. ⚠ It REJECTS `temperature` (sampling params are a 400) and thinking
 * is always on — determinism is three runs and the median, never a sampling
 * knob. `claude-fable-5-1` on `--model` for a stricter read.
 */
export const MODEL_DEFAULT_JURY = "claude-opus-5-5";

/**
 * Load `.env.local` then `.env` from `cwd` into `process.env`, first file wins,
 * shell wins over both. Returns the names it set (for a dry run to print).
 */
export function loadEnv(cwd = process.cwd()) {
  const set = [];
  for (const f of [".env.local", ".env"]) {
    const p = path.resolve(cwd, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!m || process.env[m[1]] !== undefined) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
      set.push(m[1]);
    }
  }
  return set;
}

/**
 * Build the client. Throws a clear error naming `ANTHROPIC_API_KEY` when there
 * is no key — the caller decides whether that is exit 2 or a dry run.
 */
export function makeClient({ apiKey } = {}) {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY not set — put it in .env.local (loadEnv() reads it) or export it in the shell"
    );
  }
  return new Anthropic({ apiKey: key });
}
