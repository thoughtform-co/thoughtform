/**
 * /api/design/mcp — the Thoughtform design MCP.
 *
 * Two layers, and the split is the whole architecture:
 *
 *   THE SKILL is the judgment layer. It is loaded into context and it knows
 *   the laws — what a chamfer means, when gold is allowed, why a set of cards
 *   shares one diagonal. Prose that argues.
 *
 *   THIS ROUTE is the retrieval layer. It looks things up: the live token
 *   values, the exact wording of a law, and the 53-note distilled reference
 *   corpus with its two vector spaces. Facts that can be checked.
 *
 * Never put judgment behind a tool call, and never put a searchable corpus in
 * a skill file. ("Embeddings find what's near, the LLM explains why — never
 * make the LLM guess what embeddings could look up.")
 *
 * WHY THE TOKENS ARE READ FROM DISK RATHER THAN A DATABASE: this route deploys
 * with the site, so `design_tokens` reports what the code ACTUALLY renders. A
 * token table would be one more thing to keep in step, and the first thing this
 * tool found was that DESIGN.md and app/styles/variables.css already disagree.
 * Serving live files is the fix for that class of drift, not a convenience.
 *
 * Protocol: MCP streamable HTTP, stateless — every POST is a self-contained
 * JSON-RPC exchange answered with one application/json body. No sessions, no
 * SSE (GET/DELETE return 405, which the spec allows for servers with no push
 * stream). Ported from the Astrolabe's /api/vault/mcp, minus its OAuth half:
 * this route has no /.well-known/oauth-protected-resource, and advertising a
 * resource_metadata pointer that 404s makes claude.ai fail discovery rather
 * than fall back to the bearer token.
 *
 * Auth: DESIGN_MCP_TOKEN as `Authorization: Bearer <token>` or `?token=<token>`
 * — the query form exists because claude.ai custom connectors cannot set
 * custom headers. Fails closed with 503 when the env var is unset.
 *
 * Env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 *      VOYAGE_API_KEY, DESIGN_MCP_TOKEN.
 *
 * Law 5, inherited from the vault: RANKS, NEVER SCORES. pgvector distances
 * order the list and are stripped before returning. A reader can disagree with
 * "these two cards rhyme"; nobody can disagree with 0.87, which is a judgment
 * wearing a measurement's clothes.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Fallbacks only. The authority is `design_meta`, written by
 * scripts/design-corpus/sync.mjs with the models the corpus was ACTUALLY
 * embedded with. These are what we assume when the mirror predates those rows.
 */
const TEXT_MODEL_FALLBACK = "voyage-3.5";
const IMAGE_MODEL_FALLBACK = "voyage-multimodal-3.5";

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST_PROTOCOL_VERSION = "2025-06-18";

/**
 * The 17 style axes, mirrored from the vault's tools/index/src/facets.ts and
 * scripts/design-corpus/sync.mjs. Declared here so a bad filter fails with the
 * legal vocabulary rather than silently returning nothing.
 */
const FACET_AXES: Record<string, readonly string[]> = {
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

/**
 * The law topics and where each one's canonical text lives.
 *
 * ⚠ Every path here must also appear in next.config.mjs's
 * `outputFileTracingIncludes` for this route, or the file exists in the repo
 * and is absent from the Vercel lambda — which fails at runtime only, and only
 * in production.
 */
const LAW_SOURCES: Record<string, { file: string; section?: string; label: string }> = {
  corners: {
    file: "sentinel/decisions/065-corner-law.md",
    label: "The corner law — chamfer / notch / bracket, and the lawful diagonal",
  },
  typography: {
    file: "DESIGN.md",
    section: "Typography",
    label: "The type ladder and the two families",
  },
  color: { file: "DESIGN.md", section: "Colors", label: "The colour tiers" },
  layout: {
    file: "DESIGN.md",
    section: "Layout",
    label: "Layout, grid and the corner law summary",
  },
  shape: { file: "DESIGN.md", section: "Shapes", label: "Shape law — radius, diamonds, strokes" },
  components: { file: "DESIGN.md", section: "Components", label: "Buttons, cards, HUD chrome" },
  "dos-and-donts": {
    file: "DESIGN.md",
    section: "Do's and Don'ts",
    label: "The standing anti-patterns",
  },
  grammar: {
    file: ".claude/skills/thoughtform-design/references/navigation-grammar.md",
    label: "The 12 navigation-grammar primitives, with per-product intensity",
  },
  particles: {
    file: ".claude/skills/thoughtform-design/references/particle-icon-grammar.md",
    label: "Particle glyph construction — skeleton / signal / drift",
  },
  tokens: {
    file: ".claude/skills/thoughtform-design/references/tokens.md",
    label: "The token reference (see design_tokens for LIVE values)",
  },
  composition: {
    file: "docs/design/card-reference-analysis.md",
    label: "Card composition archetypes, read off the Brand Codex reference set",
  },
};

// ---------------------------------------------------------------------------
// Env + auth
// ---------------------------------------------------------------------------

function supabaseBase(): string {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.replace(/\/$/, "");
}

function serviceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

/** Constant-length compare via digest equality. */
function tokenMatches(presented: string, expected: string): boolean {
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(expected).digest();
  return a.equals(b);
}

function unauthorized(description: string): NextResponse {
  return NextResponse.json(
    { error: "unauthorized", error_description: description },
    {
      status: 401,
      headers: {
        // No `resource_metadata`: this route serves a static bearer only. See
        // the header comment — pointing at a discovery document that does not
        // exist is worse than omitting the hint.
        "www-authenticate": `Bearer realm="thoughtform-design", error="invalid_token", error_description="${description}"`,
      },
    }
  );
}

function checkAuth(req: NextRequest): NextResponse | null {
  const staticToken = process.env.DESIGN_MCP_TOKEN ?? "";
  if (!staticToken) {
    // Fail CLOSED. An unset token must never mean "open to everyone".
    return NextResponse.json({ error: "DESIGN_MCP_TOKEN not configured" }, { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const queryToken = new URL(req.url).searchParams.get("token") ?? "";
  const presented = bearer || queryToken;
  if (!presented) return unauthorized("missing bearer token");
  if (tokenMatches(presented, staticToken)) return null;
  return unauthorized("invalid token");
}

// ---------------------------------------------------------------------------
// Repo files (the live-truth half)
// ---------------------------------------------------------------------------

async function repoFile(rel: string): Promise<string> {
  const full = path.join(process.cwd(), rel);
  try {
    return await readFile(full, "utf8");
  } catch {
    throw new Error(
      `cannot read ${rel} — if this works locally and fails on Vercel, the file is missing from ` +
        `outputFileTracingIncludes for app/api/design/mcp/route in next.config.mjs.`
    );
  }
}

/** A `## <name>` section of a markdown file, up to the next same-or-higher heading. */
function mdSection(body: string, name: string): string | null {
  const re = new RegExp(`^##\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "mi");
  const m = body.match(re);
  if (!m || m.index === undefined) return null;
  const after = body.slice(m.index + m[0].length);
  const end = after.search(/^##\s+/m);
  return (end >= 0 ? after.slice(0, end) : after).trim() || null;
}

/** Parse `--name: value;` declarations out of a CSS block, in source order. */
function parseCssVars(css: string, selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  const idx = css.indexOf(selector);
  if (idx < 0) return out;
  const open = css.indexOf("{", idx);
  if (open < 0) return out;
  // Walk braces so a nested block cannot end the scan early.
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const block = css.slice(open + 1, end);
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out[m[1].trim()] = m[2].trim();
  }
  return out;
}

/** The colour block of DESIGN.md's YAML frontmatter, flat. */
function designMdColors(body: string): Record<string, string> {
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return {};
  const out: Record<string, string> = {};
  const lines = fm[1].split(/\r?\n/);
  let inColors = false;
  for (const line of lines) {
    if (/^colors:\s*$/.test(line)) {
      inColors = true;
      continue;
    }
    if (inColors && /^\S/.test(line)) break; // dedent ends the block
    if (!inColors) continue;
    const m = line.match(/^\s+([a-z0-9-]+):\s*"?([^"]+?)"?\s*$/i);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, "");

// ---------------------------------------------------------------------------
// Supabase + Voyage
// ---------------------------------------------------------------------------

async function sbFetch(pathq: string, init?: RequestInit & { prefer?: string }): Promise<Response> {
  const base = supabaseBase();
  const key = serviceKey();
  if (!base || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
  const res = await fetch(`${base}/rest/v1/${pathq}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(init?.prefer ? { prefer: init.prefer } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(
      `supabase ${pathq.split("?")[0]} -> ${res.status}: ${(await res.text()).slice(0, 200)}`
    );
  }
  return res;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await sbFetch(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
  return (await res.json()) as T;
}

let cachedMeta: Record<string, string> | null = null;
async function meta(): Promise<Record<string, string>> {
  if (cachedMeta) return cachedMeta;
  const out: Record<string, string> = {};
  try {
    const res = await sbFetch("design_meta?select=key,value");
    for (const r of (await res.json()) as { key: string; value: string }[]) out[r.key] = r.value;
  } catch {
    /* mirror unreachable or not yet synced — fall through to fallbacks */
  }
  cachedMeta = out;
  return out;
}

/**
 * THE MODEL GUARD, doubled — one check per vector space.
 *
 * Embedding a query with a different model from the corpus produces no error
 * and no warning, just distances computed across two unrelated spaces and
 * answers that are quietly wrong. Refuse instead.
 */
async function resolveModel(space: "text" | "image"): Promise<string> {
  const m = await meta();
  const declared = m[space === "text" ? "text_embed_model" : "image_embed_model"] ?? null;
  const configured =
    space === "text" ? process.env.VOYAGE_TEXT_MODEL : process.env.VOYAGE_IMAGE_MODEL;
  if (declared && configured && declared !== configured) {
    throw new Error(
      `${space} embedding model mismatch: the corpus was built with "${declared}" but this ` +
        `deployment is configured for "${configured}". Refusing to search — querying across two ` +
        `vector spaces returns plausible nonsense. Re-sync, or unset the env override here.`
    );
  }
  return declared ?? configured ?? (space === "text" ? TEXT_MODEL_FALLBACK : IMAGE_MODEL_FALLBACK);
}

async function embedQuery(query: string, space: "text" | "image"): Promise<string> {
  const key = process.env.VOYAGE_API_KEY ?? "";
  if (!key) throw new Error("VOYAGE_API_KEY not configured");
  const model = await resolveModel(space);
  const url =
    space === "text"
      ? "https://api.voyageai.com/v1/embeddings"
      : "https://api.voyageai.com/v1/multimodalembeddings";
  // The two endpoints take different body shapes: text takes `input: string[]`,
  // multimodal takes `inputs: [{content: [{type, text}]}]`.
  const body =
    space === "text"
      ? { model, input: [query], input_type: "query" }
      : { model, input_type: "query", inputs: [{ content: [{ type: "text", text: query }] }] };

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`voyage ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = (await res.json()) as { data: { embedding: number[] }[] };
      return "[" + data.data[0].embedding.join(",") + "]"; // pgvector bracket literal
    } catch (err) {
      lastErr = err;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastErr;
}

function clamp(n: unknown, min: number, max: number, dflt: number): number {
  const v = Number(n);
  if (Number.isNaN(v)) return dflt;
  return Math.min(Math.max(Math.floor(v), min), max);
}

/** Validate a facet filter against the closed vocabulary, naming what is legal. */
function validateFacets(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, string> = {};
  for (const [axis, value] of Object.entries(raw as Record<string, unknown>)) {
    const vocab = FACET_AXES[axis];
    if (!vocab) {
      throw new Error(
        `unknown facet axis "${axis}" — use one of: ${Object.keys(FACET_AXES).join(" | ")}`
      );
    }
    const v = String(value).toLowerCase();
    if (!vocab.includes(v)) {
      throw new Error(`unknown value "${v}" for axis "${axis}" — use one of: ${vocab.join(" | ")}`);
    }
    out[axis] = v;
  }
  return Object.keys(out).length ? out : null;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

/**
 * design_tokens — the LIVE values, plus whatever disagrees with them.
 *
 * `drift` is the point of this tool. DESIGN.md's frontmatter is what the brand
 * documentation claims; variables.css is what the browser paints. They are
 * currently one rung out of step on the void ladder, and the honest answer to
 * "what colour is void" is to show both and say so.
 */
async function toolTokens(args: Record<string, unknown>): Promise<unknown> {
  const group = String(args.group ?? "all");
  const theme = String(args.theme ?? "dark");

  const css = await repoFile("app/styles/variables.css");
  const live = parseCssVars(css, ":root");

  // Light is a SINGLE override block on `html[data-theme="light"]`; dark is the
  // unqualified `:root` default and is deliberately never authored as a
  // `[data-theme="dark"]` selector (see the header of theme.css).
  let themed: Record<string, string> = {};
  if (theme === "light") {
    try {
      const themeCss = await repoFile("components/landing/v7/theme.css");
      themed = parseCssVars(themeCss, 'html[data-theme="light"]');
    } catch {
      /* theme file unreadable — dark values stand rather than a half answer */
    }
  }

  const merged = { ...live, ...themed };
  const pick = (pred: (k: string) => boolean) =>
    Object.fromEntries(Object.entries(merged).filter(([k]) => pred(k)));

  const groups: Record<string, Record<string, string>> = {
    color: pick(
      (k) =>
        /^--(void|dawn|gold|atreides|surface|alert|ink|verde)/.test(k) || /(-rgb|contrast)$/.test(k)
    ),
    typography: pick((k) => /^--(font|text|type|leading|tracking)/.test(k)),
    spacing: pick((k) => /^--(space|gap|pad|inset|margin)/.test(k)),
    motion: pick((k) => /^--(ease|duration|transition|anim)/.test(k)),
  };
  groups.other = pick((k) => !Object.values(groups).some((g) => k in g));

  // The drift check: DESIGN.md's declared colours against the live CSS.
  const drift: { token: string; design_md: string; variables_css: string; note?: string }[] = [];
  try {
    const declared = designMdColors(await repoFile("DESIGN.md"));
    for (const [name, value] of Object.entries(declared)) {
      const liveVal = live[`--${name}`];
      if (liveVal && norm(liveVal) !== norm(value)) {
        drift.push({ token: `--${name}`, design_md: value, variables_css: liveVal });
      }
    }
    if (declared.void && live["--void-deep"] && norm(declared.void) !== norm(live["--void"])) {
      drift.push({
        token: "--void (ladder)",
        design_md: declared.void,
        variables_css: live["--void"] ?? "",
        note:
          `DESIGN.md's 'void' (${declared.void}) is closest to the live --void-deep ` +
          `(${live["--void-deep"]}), and its 'surface-0' (${declared["surface-0"] ?? "?"}) to the ` +
          `live --void (${live["--void"]}). The two documents describe the same ladder with the ` +
          `names shifted one rung. Unresolved — an owner call, not a bug to auto-fix.`,
      });
    }
  } catch {
    /* DESIGN.md optional */
  }

  const body = group === "all" ? groups : { [group]: groups[group] ?? {} };
  return {
    theme,
    source: theme === "light" ? "app/styles/variables.css + theme.css" : "app/styles/variables.css",
    tokens: body,
    drift,
    note:
      "Read live from the repo at request time, so these are the values the site actually renders. " +
      (drift.length
        ? `${drift.length} declared/live disagreement(s) reported above — do not silently pick one.`
        : "No drift against DESIGN.md."),
  };
}

/** design_law — canonical law text, verbatim, from the file that owns it. */
async function toolLaw(args: Record<string, unknown>): Promise<unknown> {
  const topic = String(args.topic ?? "");
  const src = LAW_SOURCES[topic];
  if (!src) {
    throw new Error(
      `unknown topic "${topic}" — use one of: ${Object.keys(LAW_SOURCES).join(" | ")}`
    );
  }
  const body = await repoFile(src.file);
  let text = src.section ? (mdSection(body, src.section) ?? body) : body;

  // `element` narrows the grammar file to one primitive rather than returning
  // all twelve — the difference between a lookup and a document dump.
  const element = args.element ? String(args.element) : null;
  if (element && topic === "grammar") {
    const re = new RegExp(
      `^##\\s+\\d+\\.\\s*${element.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
      "mi"
    );
    const m = text.match(re);
    if (m && m.index !== undefined) {
      const after = text.slice(m.index);
      const end = after.slice(m[0].length).search(/^##\s+/m);
      text = end >= 0 ? after.slice(0, m[0].length + end) : after;
    } else {
      const names = [...text.matchAll(/^##\s+\d+\.\s*(.+)$/gm)].map((x) => x[1].trim());
      throw new Error(`unknown grammar element "${element}" — use one of: ${names.join(" | ")}`);
    }
  }

  const MAX = 24000; // a law is read, not streamed; keep a lookup a lookup
  return {
    topic,
    label: src.label,
    source: src.file + (src.section ? ` § ${src.section}` : ""),
    text:
      text.length > MAX ? text.slice(0, MAX) + `\n\n… truncated; read ${src.file} directly` : text,
  };
}

/** design_refs — semantic text search over the distilled reference corpus. */
async function toolRefs(args: Record<string, unknown>): Promise<unknown> {
  const query = String(args.query ?? "").trim();
  if (!query) throw new Error("query is required");
  const k = clamp(args.k, 1, 25, 10);
  const facets = validateFacets(args.facets);
  const vec = await embedQuery(query, "text");

  const rows = await rpc<
    {
      id: string;
      title: string;
      one_liner: string | null;
      lane: string | null;
      series: string | null;
      facets: Record<string, string>;
      original_path: string | null;
    }[]
  >("match_design_refs", {
    query_embedding: vec,
    match_count: k,
    facet_filter: facets,
    filter_lane: args.lane ? String(args.lane) : null,
    filter_series: args.series ? String(args.series) : null,
  });

  return {
    query,
    filters: { facets, lane: args.lane ?? null, series: args.series ?? null },
    results: rows.map((r, i) => ({
      rank: i + 1, // Law 5: rank, never the distance the RPC ordered by
      id: r.id,
      title: r.title,
      lesson: r.one_liner,
      lane: r.lane,
      series: r.series,
      facets: r.facets,
      original: r.original_path,
    })),
    note: "Distillations, not swatches — colours come back as ROLES projected onto tokens, never hex to lift. design_read for the full note; design_visual for what a reference LOOKS like.",
  };
}

/** design_read — one note, whole. */
async function toolRead(args: Record<string, unknown>): Promise<unknown> {
  let id = String(args.path ?? "").trim();
  if (!id) throw new Error("path is required");
  if (!id.includes("/")) id = `sources/${id}`; // bare slug convenience, as vault_read does

  const res = await sbFetch(`design_refs?id=eq.${encodeURIComponent(id)}&select=*`);
  const rows = (await res.json()) as Record<string, unknown>[];
  if (!rows.length) throw new Error(`no reference note "${id}" — try design_refs to find one`);
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    lesson: r.one_liner,
    lane: r.lane,
    series: r.series,
    ingested: r.ingested,
    facets: r.facets,
    original: r.original_path,
    body: r.body,
    image_pending_reason: r.image_pending_reason ?? undefined,
  };
}

/**
 * design_visual — the image vector space.
 *
 * The text space embeds the surveyor's PROSE about a picture; anything it did
 * not write down is invisible to retrieval permanently. This space embeds the
 * pixels, so two references can be found similar on grounds nobody articulated.
 * Until this route existed the tier was local-disk only.
 */
async function toolVisual(args: Record<string, unknown>): Promise<unknown> {
  const note = args.note ? String(args.note) : null;
  const query = args.query ? String(args.query) : null;
  if (!note && !query)
    throw new Error("pass either note (an anchor reference) or query (a description)");
  if (note && query) throw new Error("pass note OR query, not both — they are different questions");
  const k = clamp(args.k, 1, 25, 10);

  let vec: string;
  if (note) {
    // Reuse the stored vector: asking "what looks like this one" should not
    // cost an embedding call, and re-embedding would answer a slightly
    // different question than the one the corpus was built with.
    const id = note.includes("/") ? note : `sources/${note}`;
    const stored = await rpc<string | null>("design_image_vector", { note_id: id });
    if (!stored) {
      throw new Error(
        `no image vector for "${id}" — either the note does not exist, or its original was ` +
          `unreachable at sync time (design_read reports image_pending_reason).`
      );
    }
    vec = stored;
  } else {
    vec = await embedQuery(query as string, "image");
  }

  const rows = await rpc<
    {
      id: string;
      title: string;
      one_liner: string | null;
      lane: string | null;
      series: string | null;
      original_path: string | null;
    }[]
  >("match_design_visual", {
    query_embedding: vec,
    match_count: k,
    filter_lane: args.lane ? String(args.lane) : null,
    exclude_id: note ? (note.includes("/") ? note : `sources/${note}`) : null,
  });

  return {
    anchor: note ?? undefined,
    query: query ?? undefined,
    results: rows.map((r, i) => ({
      rank: i + 1,
      id: r.id,
      title: r.title,
      lesson: r.one_liner,
      lane: r.lane,
      series: r.series,
      original: r.original_path,
    })),
    note: "Ranked by pixel similarity. Open the originals to disagree — that is what `original` is for.",
  };
}

/**
 * design_facets — which aesthetic choices actually travel together.
 *
 * Reports `count` beside `expected`, never a ratio. Raw co-occurrence is
 * dominated by marginal frequency (background:dark sits on 45 of 53 notes, so
 * it co-occurs with everything and tells you nothing); the signal is whether
 * two values meet MORE than their separate commonness predicts, and the honest
 * way to show that is two counts side by side. The comparison is left to the
 * reader and never precomputed into a score.
 */
async function toolFacets(args: Record<string, unknown>): Promise<unknown> {
  const m = await meta();
  const raw = m.facet_map;
  if (!raw) throw new Error("no facet map in design_meta — run scripts/design-corpus/sync.mjs");
  const map = JSON.parse(raw) as {
    scope: number;
    axes: Record<string, Record<string, number>>;
    postings: Record<string, string[]>;
    cooccurrence: { a: string; b: string; count: number; expected: number }[];
    anomalies: { note: string; kind: string; detail: string }[];
  };

  const mode = String(args.mode ?? "histogram");
  const axis = args.axis ? String(args.axis) : null;
  const value = args.value ? String(args.value) : null;

  if (mode === "histogram") {
    return {
      scope: map.scope,
      axes: axis ? { [axis]: map.axes[axis] ?? {} } : map.axes,
      vocabulary: axis ? { [axis]: FACET_AXES[axis] } : undefined,
      anomalies: map.anomalies.length,
      note: "Counts of notes per axis value across the corpus.",
    };
  }
  if (mode === "cooccurrence") {
    let rows = map.cooccurrence;
    if (axis) rows = rows.filter((r) => r.a.startsWith(`${axis}:`) || r.b.startsWith(`${axis}:`));
    return {
      scope: map.scope,
      pairs: rows.slice(0, clamp(args.k, 1, 100, 30)),
      note:
        "count = notes carrying both. expected = count(a)*count(b)/scope, i.e. what independence " +
        "would predict. A pair well above its expectation is one decision wearing two names — the " +
        "raw material for deriving axes from the corpus instead of imposing them.",
    };
  }
  if (mode === "postings") {
    if (!axis || !value) throw new Error("postings needs both axis and value");
    return { key: `${axis}:${value}`, notes: map.postings[`${axis}:${value}`] ?? [] };
  }
  throw new Error(`unknown mode "${mode}" — use histogram | cooccurrence | postings`);
}

/** design_stats — what the corpus holds, and how complete it is. */
async function toolStats(): Promise<unknown> {
  const m = await meta();
  const res = await sbFetch(
    "design_refs?select=lane,series,image_embedding,image_pending_reason&limit=2000"
  );
  const rows = (await res.json()) as {
    lane: string | null;
    series: string | null;
    image_embedding: unknown;
    image_pending_reason: string | null;
  }[];

  const byLane: Record<string, number> = {};
  const bySeries: Record<string, number> = {};
  let withImage = 0;
  const pending: Record<string, number> = {};
  for (const r of rows) {
    byLane[r.lane ?? "unknown"] = (byLane[r.lane ?? "unknown"] ?? 0) + 1;
    bySeries[r.series ?? "unknown"] = (bySeries[r.series ?? "unknown"] ?? 0) + 1;
    if (r.image_embedding) withImage++;
    if (r.image_pending_reason)
      pending[r.image_pending_reason] = (pending[r.image_pending_reason] ?? 0) + 1;
  }

  return {
    notes_total: rows.length,
    by_lane: byLane,
    by_series: bySeries,
    image_coverage: `${withImage}/${rows.length}`,
    image_pending: pending,
    text_embed_model: m.text_embed_model ?? TEXT_MODEL_FALLBACK,
    image_embed_model: m.image_embed_model ?? IMAGE_MODEL_FALLBACK,
    facet_anomalies: m.facet_anomalies ?? "0",
    corpus_git_sha: m.corpus_git_sha ?? null,
    last_synced: m.last_synced ?? null,
    note:
      "Derived mirror of the substrate vault's design pool (the vault is authority; the surveyor " +
      "worker keeps compiling). Image coverage below the note count means some originals were " +
      "unreachable at sync time — visual search is partial, not wrong.",
  };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "design_tokens":
      return toolTokens(args);
    case "design_law":
      return toolLaw(args);
    case "design_refs":
      return toolRefs(args);
    case "design_read":
      return toolRead(args);
    case "design_visual":
      return toolVisual(args);
    case "design_facets":
      return toolFacets(args);
    case "design_stats":
      return toolStats();
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const TOOLS: ToolDef[] = [
  {
    name: "design_tokens",
    description:
      "The LIVE Thoughtform design tokens, parsed from app/styles/variables.css at request time — the values the site actually renders, not a copy that can go stale. Also reports `drift`: tokens where DESIGN.md's declared brand values disagree with the live CSS. Use before hardcoding any colour, size or easing.",
    inputSchema: {
      type: "object",
      properties: {
        group: {
          type: "string",
          enum: ["color", "typography", "spacing", "motion", "other", "all"],
          description: "Token family (default all)",
        },
        theme: {
          type: "string",
          enum: ["dark", "light"],
          description: "Which theme's resolved values (default dark)",
        },
      },
    },
  },
  {
    name: "design_law",
    description:
      "Canonical Thoughtform design law, served verbatim from the file that owns it: the corner law (ADR-065), the colour tiers, the type ladder, shape law, the anti-patterns, the 12 navigation-grammar primitives, particle-glyph construction, and the card composition archetypes. Use for exact wording, and on surfaces where the thoughtform-design skill is not loaded.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: Object.keys(LAW_SOURCES),
          description: "Which law to read",
        },
        element: {
          type: "string",
          description:
            'With topic="grammar", narrows to one primitive (e.g. "Viewport Frame", "Waypoints", "Particle Glyphs")',
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "design_refs",
    description:
      "Semantic search over the distilled design-reference corpus — FUI/HUD/terminal/landing-page references read once and written up as Layout / Patterns (mapped to the Thoughtform grammar) / Style facets / Worth adopting / Avoid. Query it BEFORE improvising a treatment or asking for screenshots: the reference has probably already been compiled. Filter by the 17 closed style axes. Ranks, never scores.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The design problem, in a phrase — 'name plate framed over a dark portrait card'",
        },
        k: { type: "integer", minimum: 1, maximum: 25, description: "Max results (default 10)" },
        facets: {
          type: "object",
          description: `Filter by style axes, e.g. {"corner-language":"chamfered","density":"dense"}. Axes: ${Object.keys(FACET_AXES).join(", ")}`,
        },
        lane: {
          type: "string",
          description: "canon (the field's work) | groundtruth (Vince's own product captures)",
        },
        series: {
          type: "string",
          description: "root | cyberpunk | panels | interfaces | lp | marathon",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "design_read",
    description:
      "The full compiled note for one reference — every section, plus the absolute path to the original image for when the pixels genuinely are the answer.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Note id ('sources/ref-…') or bare slug ('ref-…')" },
      },
      required: ["path"],
    },
  },
  {
    name: "design_visual",
    description:
      "Nearest neighbours in the IMAGE vector space — similarity over the pixels themselves, not over the prose about them, so references can match on grounds nobody wrote down. Anchor on an existing note ('what else looks like this') or describe a look in words. Complements design_refs; ranks, never scores.",
    inputSchema: {
      type: "object",
      properties: {
        note: {
          type: "string",
          description: "Anchor reference id — reuses its stored vector, no embedding call",
        },
        query: {
          type: "string",
          description: "A visual description, if you have no anchor. Mutually exclusive with note.",
        },
        k: { type: "integer", minimum: 1, maximum: 25, description: "Max results (default 10)" },
        lane: { type: "string", description: "canon | groundtruth" },
      },
    },
  },
  {
    name: "design_facets",
    description:
      "The corpus's own style statistics: per-axis histograms, which axis values travel together (count beside what independence would expect), and the note ids behind any count. Answers 'what does this reference set actually DO' rather than 'what should it do'.",
    inputSchema: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["histogram", "cooccurrence", "postings"],
          description: "Default histogram",
        },
        axis: { type: "string", description: `One of: ${Object.keys(FACET_AXES).join(", ")}` },
        value: {
          type: "string",
          description: "With mode=postings, the axis value to list notes for",
        },
        k: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "With mode=cooccurrence, max pairs (default 30)",
        },
      },
    },
  },
  {
    name: "design_stats",
    description:
      "Corpus size by lane and series, image-tier coverage (and why any picture is missing), the declared embedding models, the vault commit the mirror was built from, and when it last synced.",
    inputSchema: { type: "object", properties: {} },
  },
];

// ---------------------------------------------------------------------------
// JSON-RPC / MCP plumbing (stateless streamable HTTP)
// ---------------------------------------------------------------------------

interface JsonRpcMessage {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: number | string | null, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: number | string | null, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleMessage(msg: JsonRpcMessage): Promise<object | null> {
  const hasId =
    Object.prototype.hasOwnProperty.call(msg, "id") && msg.id !== null && msg.id !== undefined;
  const id = hasId ? (msg.id as number | string) : null;
  if (!msg.method) return hasId ? rpcError(id, -32600, "missing method") : null;
  if (!hasId) return null; // notifications get no response

  switch (msg.method) {
    case "initialize": {
      const requested = String(msg.params?.protocolVersion ?? "");
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : LATEST_PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "thoughtform-design", version: "0.1.0" },
        instructions:
          "The Thoughtform design system's retrieval layer. design_tokens and design_law serve the " +
          "LIVE repo — token values parsed from the shipped CSS, law text from the ADR that owns it — " +
          "so they cannot go stale against the code. design_refs / design_read / design_visual / " +
          "design_facets search a distilled corpus of design references compiled from Vince's own " +
          "library and mapped onto the Thoughtform navigation grammar. " +
          "QUERY, DON'T ASK: before improvising a treatment or requesting screenshots, search the " +
          "corpus — the reference has probably already been read and written up. " +
          "Results carry RANKS, NEVER SCORES: similarity between two designs is a judgment, and a " +
          "number beside it is a judgment wearing a measurement's clothes. " +
          "Colours come back as ROLES projected onto tokens ('warm accent on a dark ground → gold on " +
          "void'), never as hex to lift from a reference. " +
          "If the thoughtform-design skill is loaded, it already holds the judgment layer — reach " +
          "here for values, exact law wording, and the corpus, not for what the skill already says.",
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS });
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const out = await callTool(name, args);
        return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(out, null, 1) }] });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return rpcResult(id, {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        });
      }
    }
    default:
      return rpcError(id, -32601, `method not found: ${msg.method}`);
  }
}

export async function POST(req: NextRequest) {
  const denied = checkAuth(req);
  if (denied) return denied;

  let parsed: unknown;
  try {
    parsed = JSON.parse(await req.text());
  } catch {
    return NextResponse.json(rpcError(null, -32700, "parse error"), { status: 400 });
  }

  const batch = Array.isArray(parsed);
  const messages = (batch ? parsed : [parsed]) as JsonRpcMessage[];
  const responses: object[] = [];
  for (const msg of messages) {
    const res = await handleMessage(msg);
    if (res) responses.push(res);
  }

  if (responses.length === 0) return new NextResponse(null, { status: 202 });
  return NextResponse.json(batch ? responses : responses[0], { status: 200 });
}

// No push stream: stateless server. The spec allows 405 for GET when SSE is not offered.
export async function GET() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}
