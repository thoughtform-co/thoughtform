/**
 * The bench's one seam with the Trinny London ship (ADR-120).
 *
 * The judgment and the machinery live in the sibling repo `Arcs_Trinny London`
 * (`armada.toml`, `skill/references/rubric.md`, `tools/`, `bench/`). This site
 * hosts the FACE: every route here either spawns `bench/job.py` and returns
 * its JSON, or reads a job file the runner wrote. Nothing here grades, and
 * nothing here knows a check by name.
 *
 * ⚠ DEV-ONLY BY CONSTRUCTION. `proxy.ts` excludes `/api` from its matcher, so
 * an API route is live in production unless it refuses on its own. Every
 * route calls `devOnly()` first. On Vercel there is no Python and no Drive;
 * a 404 there is the honest answer, not a fallback.
 *
 * ⚠ THIS IS THE ONE PLACE THE SITE SPAWNS A CHILD PROCESS (no other route
 * does; see ADR-120 before generalising it). Keys never pass through here:
 * the runner reads them by name from the ship's canonical `.env`.
 */

import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { jsonError } from "@/lib/api/guards";

export const REPO =
  process.env.TRINNY_BENCH_REPO ?? path.resolve(process.cwd(), "..", "Arcs_Trinny London");
export const PY = process.env.TRINNY_BENCH_PYTHON ?? "python";
const JOB = path.join("bench", "job.py");

/** 404 outside development. Returns the response to send, or null to proceed. */
export function devOnly() {
  if (process.env.NODE_ENV === "development") return null;
  return jsonError("not found", 404, "bench_dev_only");
}

/** Run the runner to completion and parse its one-line JSON. */
export function runSync(args: string[], timeoutMs = 60_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    execFile(
      PY,
      [JOB, ...args],
      {
        cwd: REPO,
        windowsHide: true,
        timeout: timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`${err.message}\n${String(stderr).slice(-800)}`));
          return;
        }
        const text = String(stdout).trim();
        const last = text.split(/\r?\n/).filter(Boolean).pop() ?? "";
        try {
          resolve(JSON.parse(last));
        } catch {
          reject(new Error(`runner returned no JSON: ${text.slice(-400)}`));
        }
      }
    );
  });
}

/** Start a job and let go: the runner writes its own job file as it goes. */
export function runDetached(args: string[]): void {
  const child = spawn(PY, [JOB, ...args], {
    cwd: REPO,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  child.unref();
}

export interface BenchConfig {
  rubric_version: string;
  gating: boolean;
  checks: Array<{
    id: string;
    block: string;
    severity: string;
    set_level: boolean;
    check: string;
    fails_when: string;
    caption: string;
    computed: boolean;
  }>;
  subjects: Array<{
    key: string;
    noun: string;
    identity_path: string;
    mode: string;
    band: Record<string, number | string> | null;
    colours: Array<Record<string, number | string>>;
  }>;
  types: Array<{ key: string; name: string; question: string; channel: string; ar: string }>;
  settings: string[];
  lanes: Record<string, string>;
  default_lane: string;
  graders: string[];
  runs: number;
  bands: {
    status: string | null;
    measured_at: string | null;
    lines: Record<string, number> | null;
    source: string | null;
  };
  session_dir: string;
  jobs_dir: string;
  rehearsal_jobs_dir: string;
  drive_root: string;
  skill_assets: string;
  armada_version: string;
}

let cached: { at: number; value: BenchConfig } | null = null;
const CONFIG_TTL_MS = 60_000;

/** The runner's `config`, cached a minute: it is a Python start-up per call. */
export async function getConfig(fresh = false): Promise<BenchConfig> {
  if (!fresh && cached && Date.now() - cached.at < CONFIG_TTL_MS) return cached.value;
  const value = (await runSync(["config"], 90_000)) as BenchConfig;
  cached = { at: Date.now(), value };
  return value;
}

/** A job file, or null before the runner has written it. A rehearsal job
 *  (`--offline`) lives in the day's rehearsal session, so both are tried. */
export async function readJob(id: string): Promise<unknown | null> {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) return null;
  const cfg = await getConfig();
  for (const dir of [cfg.jobs_dir, cfg.rehearsal_jobs_dir].filter(Boolean)) {
    try {
      const text = await readFile(path.join(dir, `${id}.json`), "utf8");
      return JSON.parse(text);
    } catch {
      /* not here */
    }
  }
  return null;
}

/** Only files under the Drive root or the skill's assets may be served. */
export async function servable(p: string): Promise<boolean> {
  const cfg = await getConfig();
  const abs = path.resolve(p);
  for (const root of [cfg.drive_root, cfg.skill_assets]) {
    const rel = path.relative(path.resolve(root), abs);
    if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) return true;
  }
  return false;
}

export function mimeOf(p: string): string {
  const ext = path.extname(p).toLowerCase();
  return (
    {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    }[ext] ?? "application/octet-stream"
  );
}

export function newJobId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
