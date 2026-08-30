#!/usr/bin/env node
/**
 * design-corpus/sync — pull the substrate vault's design pool into this site's
 * Supabase, embedding both spaces, so /api/design/mcp can serve it.
 *
 * The vault is the AUTHORITY and is never written to. Its surveyor worker
 * distills the reference library into `sources/ref-*.md`; this script reads
 * those files off the same disk and mirrors them. Run it after a survey wave.
 *
 *   node scripts/design-corpus/sync.mjs [--dry] [--reembed] [--no-images] [--limit N]
 *
 * Env (via .env.local or the process):
 *   DESIGN_VAULT_ROOT            defaults to the sibling Astrolabe checkout
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   VOYAGE_API_KEY               (+ optional VOYAGE_TEXT_MODEL / VOYAGE_IMAGE_MODEL)
 *
 * WHY RE-EMBED RATHER THAN COPY THE VAULT'S `.index/`: those binaries are
 * gitignored, build-dependent, may be absent, and carry the vault's own model
 * constants. Reading the markdown and owning our vectors costs pennies and
 * decouples the two systems. See supabase/migrations/20260830_design_corpus.sql.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

// ── constants ────────────────────────────────────────────────────────────────

const DEFAULT_VAULT = path.resolve(
  process.cwd(),
  "..",
  "02_thoughtform_astrolabe",
  "content",
  "substrate",
);

const TEXT_MODEL = process.env.VOYAGE_TEXT_MODEL ?? "voyage-3.5";
const IMAGE_MODEL = process.env.VOYAGE_IMAGE_MODEL ?? "voyage-multimodal-3.5";

/** Voyage caps one image at 20MB; skip before spending a request to be told so. */
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
/**
 * Images per request. The API allows many inputs but caps a request at ~320k
 * tokens, and an image costs roughly its pixel count / 560 — a handful of large
 * captures reaches the ceiling long before the input count does.
 */
const IMAGE_BATCH = 6;
const TEXT_BATCH = 64;

const MEDIA_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * The 17 axes and their closed vocabularies, mirrored BY HAND from the vault's
 * `tools/index/src/facets.ts` (which itself mirrors the surveyor skill). Same
 * bargain the vault takes with its own cloud route: two declarations that
 * change rarely, kept in step deliberately rather than shared across repos.
 *
 * An unknown value is an ANOMALY TO REPORT, never a new enum member to accept —
 * but it is still stored, because the note says what it says.
 */
const FACET_AXES = {
  brackets: ["none", "corners", "full", "targeting"],
  reticles: ["none", "subtle", "prominent"],
  ticks: ["none", "sparse", "dense"],
  grids: ["none", "subtle", "visible", "prominent"],
  scanlines: ["none", "subtle", "visible"],
  labels: ["minimal", "technical", "ornate"],
  "corner-language": ["squared", "chamfered", "notched", "bracketed"],
  "line-weight": ["hairline", "light", "medium", "heavy"],
  density: ["sparse", "balanced", "dense"],
  spacing: ["tight", "balanced", "loose"],
  hierarchy: ["flat", "subtle", "pronounced"],
  background: ["dark", "mid", "light"],
  accent: ["warm", "cool", "neutral"],
  text: ["high-contrast", "medium", "low-contrast"],
  mono: ["prominent", "subtle", "none"],
  glow: ["none", "subtle", "strong"],
  grain: ["none", "subtle", "strong"],
};

// ── small helpers ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

/** Load .env.local / .env without a dependency (KEY=value, ignoring comments). */
function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!m) continue;
      const key = m[1];
      if (process.env[key] !== undefined) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[key] = v;
    }
  }
}

/**
 * Postgres `text` rejects NUL with SQLSTATE 22P05, which 400s the whole batch.
 * Extraction pipelines leave stray NULs; strip them from every pushed string.
 */
const pg = (s) => (s ?? "").split(String.fromCharCode(0)).join("");

/**
 * The vault permits partial dates ("2026-07"); a Postgres `date` column does
 * not, and answers SQLSTATE 22007 by 400ing the batch. Widen to the first
 * instant of the stated precision — a July-precision note sorts into July,
 * which is all any filter here asks. Unparseable becomes null, never guessed.
 */
function pgDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  return null;
}

const vecLiteral = (v) => "[" + v.join(",") + "]"; // pgvector's bracket form

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function withRetry(fn, label) {
  const delays = [1000, 4000, 9000];
  let lastErr;
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < delays.length) {
        console.error(`  retry ${label} after ${String(err).slice(0, 120)}`);
        await new Promise((r) => setTimeout(r, delays[i]));
      }
    }
  }
  throw lastErr;
}

// ── vault parsing ────────────────────────────────────────────────────────────

/** Split `---\n...\n---\n<body>` into a flat frontmatter map + the body. */
function parseNote(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: m[2] };
}

/** The `## <name>` section body, up to the next `## `. */
function section(body, name) {
  const re = new RegExp(`^##\\s+${name}\\s*$`, "m");
  const m = body.match(re);
  if (!m || m.index === undefined) return null;
  const after = body.slice(m.index + m[0].length);
  const end = after.search(/^##\s+/m);
  const out = (end >= 0 ? after.slice(0, end) : after).trim();
  return out || null;
}

/**
 * Parse the `## Style facets` block into {axis: value}.
 *
 * TWO lessons ported verbatim from the vault's facets.ts, both of which fail
 * SILENTLY if ignored:
 *  1. The block is SOFT-WRAPPED across 4–5 physical lines with no continuation
 *     marker, and ` · ` can land at end-of-line. Flatten the whole section
 *     before splitting, or an axis is dropped at every wrap point.
 *  2. Key by axis NAME, never by position — at least one note in the pool emits
 *     its last axes out of order, and a positional parser mislabels them
 *     without erroring, which is the worst kind of wrong: the counts still
 *     look plausible.
 */
function parseFacets(id, body, anomalies) {
  const block = section(body, "Style facets");
  if (!block) {
    anomalies.push({ note: id, kind: "missing-block", detail: "no ## Style facets" });
    return {};
  }
  const flat = block.replace(/\s+/g, " ").trim();
  const out = {};
  for (const part of flat.split("·")) {
    const seg = part.trim();
    if (!seg) continue;
    const idx = seg.indexOf(":");
    if (idx < 0) {
      anomalies.push({ note: id, kind: "unknown-axis", detail: `unparseable ${JSON.stringify(seg)}` });
      continue;
    }
    const axis = seg.slice(0, idx).trim().toLowerCase();
    const value = seg.slice(idx + 1).trim().toLowerCase();
    const vocab = FACET_AXES[axis];
    if (!vocab) {
      anomalies.push({ note: id, kind: "unknown-axis", detail: `${axis}: ${value}` });
      continue;
    }
    if (axis in out) {
      anomalies.push({ note: id, kind: "duplicate-axis", detail: axis });
      continue;
    }
    // Recorded and STILL STORED: a value outside the enum is a fact about the
    // corpus worth seeing, not data to discard.
    if (!vocab.includes(value)) {
      anomalies.push({ note: id, kind: "unknown-value", detail: `${axis}: ${value}` });
    }
    out[axis] = value;
  }
  for (const axis of Object.keys(FACET_AXES)) {
    if (!(axis in out)) anomalies.push({ note: id, kind: "missing-axis", detail: axis });
  }
  return out;
}

/** Read every `type: reference` note, joined to its raw twin's picture hash. */
function readCorpus(vaultRoot, limit) {
  const srcDir = path.join(vaultRoot, "sources");
  if (!fs.existsSync(srcDir)) {
    throw new Error(`vault sources/ not found at ${srcDir} — set DESIGN_VAULT_ROOT`);
  }
  const anomalies = [];
  const notes = [];
  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.startsWith("ref-") && f.endsWith(".md"))
    .sort(); // deterministic order: a diff should mean the corpus moved

  for (const file of files) {
    const full = path.join(srcDir, file);
    const raw = fs.readFileSync(full, "utf8");
    const { fm, body } = parseNote(raw);
    if (fm.type !== "reference") continue;

    const id = `sources/${file.replace(/\.md$/, "")}`;
    const titleM = body.match(/^#\s+(.+)$/m);
    const oneM = body.match(/^>\s+(.+)$/m);

    // The PICTURE's hash lives on the raw twin (the immutable record of what
    // arrived); the note only points at it via `raw:`. Using the note's own
    // hash instead looks equivalent and re-embeds unchanged pictures whenever
    // the prose is edited.
    let rawSha = null;
    if (fm.raw) {
      const rawPath = path.join(vaultRoot, fm.raw);
      if (fs.existsSync(rawPath)) {
        const rfm = parseNote(fs.readFileSync(rawPath, "utf8")).fm;
        if (rfm.sha256) rawSha = rfm.sha256.replace(/^sha256:/, "");
      }
    }

    notes.push({
      id,
      title: titleM ? titleM[1].trim() : id,
      one_liner: oneM ? oneM[1].trim() : null,
      lane: fm.lane ?? null,
      series: fm.series ?? null,
      org: fm.org ?? null,
      ingested: pgDate(fm.ingested),
      encountered: pgDate(fm.encountered),
      original_path: fm.original ?? null,
      raw_sha256: rawSha,
      content_hash: sha256(raw),
      body,
      adopt_md: section(body, "Worth adopting"),
      avoid_md: section(body, "Avoid"),
      facets: parseFacets(id, body, anomalies),
    });
    if (limit && notes.length >= limit) break;
  }
  return { notes, anomalies };
}

/**
 * The facet co-occurrence map — the Mosaic move: which aesthetic choices
 * actually travel together, so axes can be DERIVED from the corpus rather than
 * imposed. Reports `count` beside `expected`, never a ratio: raw co-occurrence
 * is dominated by marginal frequency (background:dark sits on most notes), and
 * a single correlation number is the same fact wearing a measurement's clothes.
 */
function buildFacetMap(notes, anomalies) {
  const axes = {};
  const postings = {};
  const pairs = new Map();
  let scope = 0;

  for (const n of notes) {
    const entries = Object.entries(n.facets);
    if (!entries.length) continue;
    scope++;
    const keys = [];
    for (const [axis, value] of entries) {
      (axes[axis] ??= {})[value] = (axes[axis][value] ?? 0) + 1;
      const key = `${axis}:${value}`;
      (postings[key] ??= []).push(n.id);
      keys.push(key);
    }
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const k = `${keys[i]}\u0000${keys[j]}`;
        pairs.set(k, (pairs.get(k) ?? 0) + 1);
      }
    }
  }

  const seen = (k) => postings[k]?.length ?? 0;
  const cooccurrence = [];
  for (const [k, count] of pairs) {
    if (count < 2) continue; // pairs seen once are noise at this size
    const [a, b] = k.split("\u0000");
    cooccurrence.push({
      a,
      b,
      count,
      expected: scope > 0 ? Math.round((seen(a) * seen(b)) / scope) : 0,
    });
  }
  cooccurrence.sort((x, y) => y.count - x.count || (x.a + x.b < y.a + y.b ? -1 : 1));

  return { scope, axes, postings, cooccurrence, anomalies };
}

// ── embedding ────────────────────────────────────────────────────────────────

/** What the text space actually embeds: the distillation, not the raw markdown. */
function embedText(n) {
  const facetLine = Object.entries(n.facets)
    .map(([a, v]) => `${a}: ${v}`)
    .join(" · ");
  return [
    n.title,
    n.one_liner ?? "",
    section(n.body, "Layout") ?? "",
    section(n.body, "Patterns") ?? "",
    facetLine,
    n.adopt_md ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function embedTexts(key, texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += TEXT_BATCH) {
    const slice = texts.slice(i, i + TEXT_BATCH);
    const vecs = await withRetry(async () => {
      const res = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        // `document` here; the MCP route embeds queries with input_type "query".
        // The convention is declared in design_meta so an asymmetry is detectable.
        body: JSON.stringify({ model: TEXT_MODEL, input: slice, input_type: "document" }),
      });
      if (!res.ok) throw new Error(`voyage text ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    }, "text embed");
    out.push(...vecs);
    if (texts.length > TEXT_BATCH) {
      console.error(`  text ${Math.min(i + TEXT_BATCH, texts.length)}/${texts.length}`);
    }
  }
  return out;
}

async function embedImageBatch(key, items) {
  return withRetry(async () => {
    const res = await fetch("https://api.voyageai.com/v1/multimodalembeddings", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        input_type: "document",
        inputs: items.map((it) => ({
          content: [
            {
              type: "image_base64",
              // The data-URI prefix is required by the API, not decoration.
              image_base64: `data:${it.mediaType};base64,${it.bytes.toString("base64")}`,
            },
          ],
        })),
      }),
    });
    if (!res.ok) throw new Error(`voyage multimodal ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    // Sort by index: the API documents an index per row, not input order.
    return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }, "image embed");
}

// ── PostgREST ────────────────────────────────────────────────────────────────

async function rest(base, key, method, pathq, body, prefer) {
  const res = await fetch(`${base}/rest/v1/${pathq}`, {
    method,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(prefer ? { prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${method} ${pathq} -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res;
}

/**
 * Delete rows the vault no longer has.
 *
 * The obvious `DELETE ?id=not.in.(<every id>)` puts the keep-list in the URL,
 * which grows with the corpus and 400s past ~30KB. Page the ids in, diff in JS,
 * delete only the stale ones: URL size then scales with what is STALE.
 */
async function deleteStale(base, key, keep) {
  const PAGE = 1000;
  const cloud = [];
  for (let from = 0; ; from += PAGE) {
    const res = await rest(base, key, "GET", `design_refs?select=id&order=id.asc&limit=${PAGE}&offset=${from}`);
    const batch = await res.json();
    cloud.push(...batch.map((r) => r.id));
    if (batch.length < PAGE) break;
  }
  const stale = cloud.filter((id) => !keep.has(id));
  if (!stale.length) return 0;
  const CHUNK = 60;
  for (let i = 0; i < stale.length; i += CHUNK) {
    const list = stale.slice(i, i + CHUNK).map((id) => `"${encodeURIComponent(id)}"`).join(",");
    await rest(base, key, "DELETE", `design_refs?id=in.(${list})`, undefined, "return=minimal");
  }
  return stale.length;
}

async function upsertBatched(base, key, table, rows) {
  const BATCH = 50; // vectors are large; keep request bodies sane
  for (let i = 0; i < rows.length; i += BATCH) {
    await rest(base, key, "POST", table, rows.slice(i, i + BATCH), "resolution=merge-duplicates,return=minimal");
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  loadEnvFiles();

  const vaultRoot = process.env.DESIGN_VAULT_ROOT ?? DEFAULT_VAULT;
  // Same fallback the route takes: this repo's .env.local carries only the
  // NEXT_PUBLIC_ form of the project URL (the URL is not a secret; the service
  // role key beside it is).
  const base = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const voyage = process.env.VOYAGE_API_KEY ?? "";
  const dry = flag("--dry");
  const reembed = flag("--reembed");
  const noImages = flag("--no-images");
  const limit = Number(opt("--limit", "0")) || 0;

  console.error(`design-corpus sync`);
  console.error(`  vault  ${vaultRoot}`);
  console.error(`  models ${TEXT_MODEL} (text) · ${IMAGE_MODEL} (image)`);

  if (!dry) {
    if (!base || !key) {
      throw new Error("set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
    }
    if (!voyage) throw new Error("set VOYAGE_API_KEY");
  }

  const { notes, anomalies } = readCorpus(vaultRoot, limit);
  console.error(`  read   ${notes.length} reference notes, ${anomalies.length} facet anomalies`);
  if (!notes.length) throw new Error("no reference notes found — wrong DESIGN_VAULT_ROOT?");

  const facetMap = buildFacetMap(notes, anomalies);

  let corpusSha = "unknown";
  try {
    corpusSha = execFileSync("git", ["-C", vaultRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    /* the vault may not be a git checkout in every environment */
  }

  if (dry) {
    console.error(`  DRY RUN — no embedding, no push`);
    console.error(`  facet scope ${facetMap.scope}, ${facetMap.cooccurrence.length} pairs >= 2`);
    const withImg = notes.filter((n) => n.original_path && fs.existsSync(n.original_path)).length;
    console.error(`  originals reachable on disk: ${withImg}/${notes.length}`);
    for (const a of anomalies.slice(0, 10)) console.error(`   ! ${a.kind} ${a.note} — ${a.detail}`);
    return;
  }

  // What the cloud already holds, so unchanged rows cost nothing.
  //
  // ⚠ NOT wrapped in a silent catch. A prefetch that fails quietly makes every
  // row look new and re-embeds the whole corpus while reporting success — which
  // is exactly what an invalid select here did on the first run. If the mirror
  // cannot be read, that is worth failing on; only a MISSING TABLE (first run
  // ever) is a legitimate empty result, and that surfaces as a 404 we name.
  const existing = new Map();
  try {
    const res = await rest(
      base,
      key,
      "GET",
      "design_refs?select=id,content_hash,raw_sha256,image_sha256&limit=5000",
    );
    for (const r of await res.json()) existing.set(r.id, r);
  } catch (err) {
    if (!/-> 40[04]/.test(String(err))) throw err;
    console.error(`  ! no existing corpus readable (${String(err).slice(0, 120)}) — treating every note as new`);
  }
  const declared = {};
  try {
    const res = await rest(base, key, "GET", "design_meta?select=key,value");
    for (const r of await res.json()) declared[r.key] = r.value;
  } catch (err) {
    if (!/-> 40[04]/.test(String(err))) throw err;
  }
  const textModelChanged = declared.text_embed_model && declared.text_embed_model !== TEXT_MODEL;
  const imageModelChanged = declared.image_embed_model && declared.image_embed_model !== IMAGE_MODEL;
  if (textModelChanged) console.error(`  ! text model changed (${declared.text_embed_model} -> ${TEXT_MODEL}); re-embedding all`);
  if (imageModelChanged) console.error(`  ! image model changed (${declared.image_embed_model} -> ${IMAGE_MODEL}); re-embedding all`);

  // ── text space ──
  const needText = notes.filter((n) => {
    if (reembed || textModelChanged) return true;
    const prev = existing.get(n.id);
    return !prev || prev.content_hash !== n.content_hash;
  });
  console.error(`  text   ${needText.length} to embed, ${notes.length - needText.length} reused`);
  const textVecs = needText.length ? await embedTexts(voyage, needText.map(embedText)) : [];
  const textByFile = new Map(needText.map((n, i) => [n.id, textVecs[i]]));

  // ── image space ──
  const pending = [];
  const imageByFile = new Map();
  if (!noImages) {
    const queue = [];
    let skipped = 0;
    for (const n of notes) {
      const prev = existing.get(n.id);
      // Reuse only when the stored VECTOR was computed from this exact picture.
      // `image_sha256` is written on success alone, so a note that was pending
      // last run is retried, and an unchanged picture is never re-embedded.
      const reusable =
        !reembed &&
        !imageModelChanged &&
        prev &&
        prev.image_sha256 &&
        n.raw_sha256 &&
        prev.image_sha256 === n.raw_sha256;
      if (reusable) {
        skipped++;
        continue;
      }
      if (!n.original_path) {
        pending.push({ note: n.id, reason: "no original: path" });
        continue;
      }
      let stat;
      try {
        stat = fs.statSync(n.original_path);
      } catch {
        // Non-fatal by contract: I:\ may not be mounted. A partial tier is fine;
        // design_stats reports the coverage so nobody mistakes it for complete.
        pending.push({ note: n.id, reason: "original not found on disk" });
        continue;
      }
      if (stat.size > MAX_IMAGE_BYTES) {
        pending.push({ note: n.id, reason: `${Math.round(stat.size / 1048576)}MB exceeds the 20MB limit` });
        continue;
      }
      const mediaType = MEDIA_TYPES[path.extname(n.original_path).toLowerCase()];
      if (!mediaType) {
        pending.push({ note: n.id, reason: `unsupported extension ${path.extname(n.original_path)}` });
        continue;
      }
      queue.push({ note: n, mediaType });
    }
    console.error(`  image  ${queue.length} to embed, ${skipped} reused, ${pending.length} pending`);

    for (let i = 0; i < queue.length; i += IMAGE_BATCH) {
      const batch = queue.slice(i, i + IMAGE_BATCH);
      const items = [];
      for (const b of batch) {
        try {
          items.push({ ...b, bytes: fs.readFileSync(b.note.original_path) });
        } catch {
          pending.push({ note: b.note.id, reason: "unreadable" });
        }
      }
      if (!items.length) continue;
      try {
        const vecs = await embedImageBatch(voyage, items);
        items.forEach((it, j) => {
          if (vecs[j]?.length) imageByFile.set(it.note.id, vecs[j]);
          else pending.push({ note: it.note.id, reason: "no vector returned" });
        });
      } catch (err) {
        // A failed batch is recorded and skipped, never fatal.
        for (const it of items) {
          pending.push({ note: it.note.id, reason: `embed failed: ${String(err).slice(0, 140)}` });
        }
      }
      console.error(`  image  ${Math.min(i + IMAGE_BATCH, queue.length)}/${queue.length}`);
    }
  }

  // ── push: META FIRST ──
  // Ordering is deliberate: a half-failed push must still describe what the
  // rows were built with, or the MCP's model guard has nothing to check.
  const pendingById = new Map(pending.map((p) => [p.note, p.reason]));
  await upsertBatched(base, key, "design_meta", [
    { key: "text_embed_model", value: TEXT_MODEL, updated_at: new Date().toISOString() },
    { key: "image_embed_model", value: IMAGE_MODEL, updated_at: new Date().toISOString() },
    { key: "embed_input_type", value: "document/query", updated_at: new Date().toISOString() },
    { key: "corpus_git_sha", value: corpusSha, updated_at: new Date().toISOString() },
    { key: "last_synced", value: new Date().toISOString(), updated_at: new Date().toISOString() },
    { key: "facet_map", value: JSON.stringify(facetMap), updated_at: new Date().toISOString() },
    { key: "facet_anomalies", value: String(anomalies.length), updated_at: new Date().toISOString() },
  ]);

  const rows = notes.map((n) => {
    const row = {
      id: n.id,
      title: pg(n.title),
      one_liner: n.one_liner ? pg(n.one_liner) : null,
      lane: n.lane,
      series: n.series,
      org: n.org,
      ingested: n.ingested,
      encountered: n.encountered,
      original_path: n.original_path ? pg(n.original_path) : null,
      raw_sha256: n.raw_sha256,
      content_hash: n.content_hash,
      body: pg(n.body),
      adopt_md: n.adopt_md ? pg(n.adopt_md) : null,
      avoid_md: n.avoid_md ? pg(n.avoid_md) : null,
      facets: n.facets,
      image_pending_reason: pendingById.get(n.id) ?? null,
      updated_at: new Date().toISOString(),
    };
    // Only send a vector column when we have a fresh one — omitting it leaves
    // the stored value untouched on a merge-duplicates upsert.
    const tv = textByFile.get(n.id);
    if (tv) row.text_embedding = vecLiteral(tv);
    const iv = imageByFile.get(n.id);
    if (iv) {
      row.image_embedding = vecLiteral(iv);
      // Stamp WHICH picture this vector came from, in the same write. Set here
      // and nowhere else, so the column can only ever describe a stored vector.
      row.image_sha256 = n.raw_sha256;
    }
    return row;
  });

  await upsertBatched(base, key, "design_refs", rows);
  const removed = await deleteStale(base, key, new Set(notes.map((n) => n.id)));

  console.error(`\ndesign-corpus sync complete`);
  console.error(`  notes      ${rows.length} upserted, ${removed} stale removed`);
  console.error(`  text       ${needText.length} embedded`);
  console.error(`  images     ${imageByFile.size} embedded, ${pending.length} pending`);
  console.error(`  facets     scope ${facetMap.scope}, ${facetMap.cooccurrence.length} pairs, ${anomalies.length} anomalies`);
  console.error(`  corpus sha ${corpusSha.slice(0, 12)}`);
  for (const p of pending.slice(0, 8)) console.error(`   pending ${p.note} — ${p.reason}`);
  if (pending.length > 8) console.error(`   ... and ${pending.length - 8} more`);
}

main().catch((err) => {
  console.error(`\nsync failed: ${err.message}`);
  process.exit(1);
});
