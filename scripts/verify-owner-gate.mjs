/**
 * verify-owner-gate — the owner's gate against a REAL production build
 * (ADR-117). The unit tests prove the pass; only a build proves the page has
 * no prerendered copy and that every URL shape a stranger could try answers
 * with the site's ordinary 404.
 *
 *   PowerShell:
 *   $env:NEXT_DIST_DIR=".next-verify"; npx next build --webpack; Remove-Item Env:NEXT_DIST_DIR
 *   node scripts/verify-owner-gate.mjs [--port 3011] [--dist .next-verify]
 *
 * ⚠ IT STARTS ITS OWN SERVER ON ITS OWN PORT. `npm run start` has a
 * `prestart` that kills :3003, which is the dev server another session is
 * using. This spawns `next start` directly.
 *
 * ⚠ THE SECRET IS EPHEMERAL AND NEVER PRINTED: generated here, handed to the
 * server through its environment, and used to sign test cookies with
 * `scripts/owner-pass/signPass.mjs` — a second implementation of the format,
 * so a drift between the two fails here.
 */

import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { COOKIE, TTL_S, signPass } from "./owner-pass/signPass.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argOf = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const PORT = Number(argOf("--port", "3011"));
const DIST = argOf("--dist", process.env.NEXT_DIST_DIR || ".next-verify");
const BASE = `http://localhost:${PORT}`;
const SECRET = randomBytes(32).toString("base64url");

/**
 * Strings only the overview letters: client NAMES and a lede. ⚠ Never the
 * proposal SLUGS — every page of the site carries the four light-locked
 * proposal routes in its head scripts (`LIGHT_LOCKED_ROUTES`, `HERO_ROUTES`),
 * the homepage and every 404 included, which is a finding of its own
 * (ADR-117 §Left open) and not what this gate is about.
 */
const OVERVIEW_TELLS = [
  "Hungry Minds",
  "Perfect Ted",
  "Trinny London",
  "Loop Earplugs",
  /* A phrase ONLY the overview letters — the instrument's own line (ADR-118).
     It was a client lede while the overview drew the consoles; the instrument
     letters no client lede, and a tell the owner's copy lacks would let the
     leak checks above pass on a page that shows nothing. */
  "plotted at the date it was filed",
];

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const tellsIn = (body) => OVERVIEW_TELLS.filter((t) => body.includes(t));
const titleOf = (body) => body.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? null;
const now = () => Math.floor(Date.now() / 1000);

async function get(p, { cookie, headers = {}, method = "GET", redirect = "manual" } = {}) {
  const res = await fetch(`${BASE}${p}`, {
    method,
    redirect,
    headers: { ...headers, ...(cookie ? { Cookie: `${COOKIE}=${cookie}` } : {}) },
  });
  return { status: res.status, headers: res.headers, body: await res.text() };
}

// ── 1 · The build ────────────────────────────────────────────────────────────
const distAbs = path.join(ROOT, DIST);
if (!existsSync(path.join(distAbs, "BUILD_ID"))) {
  console.error(`No build in ${DIST}. Build first (see the header).`);
  process.exit(2);
}
const appDir = path.join(distAbs, "server", "app");
console.log(`build ${DIST}`);
for (const f of ["arcs.html", "arcs.rsc", "arcs.segments", "arcs.meta"])
  check(`no prerendered ${f}`, !existsSync(path.join(appDir, f)));
check("the client pages are still prerendered", existsSync(path.join(appDir, "arcs", "loop.html")));

// The overview's data lives in no static chunk (a client component that
// imported the registry would ship the whole client list to everyone).
const chunkHits = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".js")) {
      const src = readFileSync(p, "utf8");
      if (OVERVIEW_TELLS.slice(0, 3).every((t) => src.includes(t)))
        chunkHits.push(path.relative(distAbs, p));
    }
  }
})(path.join(distAbs, "static"));
check("no static chunk carries the client list", chunkHits.length === 0, chunkHits.join(", "));

// ── 2 · The server ───────────────────────────────────────────────────────────
const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
  cwd: ROOT,
  env: { ...process.env, NODE_ENV: "production", NEXT_DIST_DIR: DIST, OWNER_PASS_SECRET: SECRET },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

function stop() {
  if (server.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
  else server.kill("SIGTERM");
}
process.on("exit", stop);

async function waitUp() {
  const t0 = Date.now();
  while (Date.now() - t0 < 120_000) {
    try {
      const r = await fetch(`${BASE}/`, { redirect: "manual" });
      if (r.status < 500) return true;
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 750));
  }
  return false;
}

try {
  if (!(await waitUp())) {
    console.error("server did not come up:\n" + serverLog.slice(-2000));
    process.exit(2);
  }
  console.log(`server ${BASE}`);

  // ── 3 · A stranger ─────────────────────────────────────────────────────────
  const missing = await get(`/__tf-no-such-page-${randomBytes(4).toString("hex")}`);
  const baselineTitle = titleOf(missing.body);
  const anonymous = [
    ["/arcs", {}],
    ["/arcs", { headers: { RSC: "1" } }],
    ["/arcs?_rsc=verify", { headers: { RSC: "1", "Next-Router-Prefetch": "1" } }],
    ["/arcs.rsc", {}],
    ["/arcs.segments/_full.segment.rsc", {}],
    ["/%61rcs", {}],
    ["/ARCS", {}],
    ["/arcs/", { redirect: "follow" }],
  ];
  for (const [p, opts] of anonymous) {
    const r = await get(p, opts);
    const tells = tellsIn(r.body);
    // A flight (RSC) request answers 200 with the not-found tree INSIDE the
    // payload — Next's own protocol — so for those the content is the test.
    const flight = Boolean(opts.headers?.RSC);
    check(
      `anonymous ${p}${opts.headers ? " " + JSON.stringify(opts.headers) : ""} → ${flight ? "no overview in the payload" : "404"}, nothing lettered`,
      (flight ? r.status < 500 : r.status === 404) && tells.length === 0,
      `status ${r.status}${tells.length ? `, letters ${tells.join(", ")}` : ""}`
    );
  }
  const anonTitle = titleOf((await get("/arcs")).body);
  check(
    "the denied overview carries the ordinary 404's title",
    anonTitle === baselineTitle,
    `${anonTitle} vs ${baselineTitle}`
  );

  // ── 4 · Bad passes ──────────────────────────────────────────────────────────
  const good = signPass(SECRET, now() + 3600);
  const [v, exp, mac] = good.split(".");
  const bad = {
    expired: signPass(SECRET, now() - 10),
    tampered: `${v}.${exp}.${mac[0] === "A" ? "B" : "A"}${mac.slice(1)}`,
    "another version": signPass(SECRET, now() + 3600, "v2"),
    "another key": signPass(randomBytes(32).toString("base64url"), now() + 3600),
    "too long-lived": signPass(SECRET, now() + TTL_S + 7200),
  };
  for (const [name, cookie] of Object.entries(bad)) {
    const r = await get("/arcs", { cookie });
    check(
      `a pass that is ${name} → 404`,
      r.status === 404 && tellsIn(r.body).length === 0,
      `status ${r.status}`
    );
  }

  // ── 5 · The owner ───────────────────────────────────────────────────────────
  const owner = await get("/arcs", { cookie: good });
  const cc = owner.headers.get("cache-control") ?? "";
  check("the owner's pass opens the overview", owner.status === 200, `status ${owner.status}`);
  check(
    "the overview letters every client",
    tellsIn(owner.body).length === OVERVIEW_TELLS.length,
    tellsIn(owner.body).join(", ")
  );
  check("the owner's copy is never cached publicly", /no-store|private/.test(cc), cc);
  check(
    "the owner's overview has its own title",
    titleOf(owner.body) === "Arcs — Thoughtform",
    titleOf(owner.body) ?? ""
  );
  const ownerRsc = await get("/arcs", { cookie: good, headers: { RSC: "1" } });
  check(
    "the owner's RSC request answers too",
    ownerRsc.status === 200,
    `status ${ownerRsc.status}`
  );

  // ── 6 · The mint route ──────────────────────────────────────────────────────
  const noBearer = await get("/api/owner-pass", { method: "POST" });
  check(
    "POST /api/owner-pass without a bearer → 401, no cookie",
    noBearer.status === 401 && !noBearer.headers.get("set-cookie"),
    `status ${noBearer.status}`
  );
  const garbage = await get("/api/owner-pass", {
    method: "POST",
    headers: { Authorization: "Bearer not-a-jwt" },
  });
  check(
    "POST /api/owner-pass with a forged bearer → 401, no cookie",
    garbage.status === 401 && !garbage.headers.get("set-cookie"),
    `status ${garbage.status}`
  );

  // ── 7 · What stays public ───────────────────────────────────────────────────
  for (const p of [
    "/arcs/loop",
    "/arcs/suri-proposal",
    "/arcs/trinny-london/proposal",
    "/arcs/loop-earplugs",
  ]) {
    const r = await get(p);
    check(`anonymous ${p} → 200`, r.status === 200, `status ${r.status}`);
  }
} finally {
  stop();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
