#!/usr/bin/env node
// Video reads, paid once. A CDAF sidecar (https://github.com/UditAkhourii/cdaf)
// is a hash-anchored text description of one exact video; an agent reads it
// instead of re-watching. This is the repo's own CLI for the format, so the
// reads carry the practice's prompts (feedback, references, diagrams) rather
// than the upstream b-roll prompt, and run on the canonical .env key.
//
//   node scripts/video-read/cdaf.mjs status <video|dir>...
//   node scripts/video-read/cdaf.mjs read <video>
//   node scripts/video-read/cdaf.mjs find <word>...
//   node scripts/video-read/cdaf.mjs generate <video|dir> [--profile feedback|reference|diagrams|footage]
//                                        [--context "what this video is"] [--model id] [--force] [--no-beside]
//
// Where reads live: the LIBRARY is docs/video-reads/ (versioned, readable from
// any session, looked up by size + sha256 so a renamed or moved video still
// hits). A copy is also written beside the video, the spec's own place, unless
// --no-beside. Both are byte-identical and hash-anchored, so neither can drift.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  VIDEO_EXT,
  freshness,
  hms,
  parseCdaf,
  serializeCdaf,
  sha256File,
  sidecarPathFor,
  validateCdaf,
} from "./cdafCore.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const LIBRARY = join(REPO, "docs", "video-reads");
const ENV_FILE =
  process.env.CDAF_ENV ??
  "C:\\Users\\buyss\\Manifold Delta\\Artifacts\\Arcs_In The Pocket\\projects\\20260820-ai-readiness\\skill\\scripts\\.env";
const DEFAULT_MODEL = "gemini-3.1-pro-preview";
const FALLBACK_MODEL = "gemini-2.5-pro";
const API = "https://generativelanguage.googleapis.com";

// ---------------------------------------------------------------- lookup

function videosUnder(p) {
  const st = statSync(p);
  if (st.isFile()) return VIDEO_EXT.test(p) ? [p] : [];
  return readdirSync(p, { withFileTypes: true }).flatMap((d) =>
    d.name.startsWith(".") ? [] : videosUnder(join(p, d.name))
  );
}

function librarySidecars() {
  if (!existsSync(LIBRARY)) return [];
  return readdirSync(LIBRARY)
    .filter((f) => f.endsWith(".cdaf"))
    .map((f) => join(LIBRARY, f));
}

/** The fresh sidecar for a video: beside it first, then the library by size, then by hash. */
export async function lookup(video) {
  const size = String(statSync(video).size);
  const candidates = [];
  const beside = sidecarPathFor(video);
  if (existsSync(beside)) candidates.push(beside);
  for (const f of librarySidecars()) candidates.push(f);
  let stale = null;
  for (const path of candidates) {
    let parsed;
    try {
      parsed = parseCdaf(readFileSync(path, "utf8"));
    } catch {
      continue;
    }
    if (parsed.header.bytes !== size) {
      if (path === beside) stale = path;
      continue;
    }
    if ((await freshness(video, parsed.header)) === "fresh")
      return { path, parsed, state: "fresh" };
    if (path === beside) stale = path;
  }
  return { path: stale, parsed: null, state: stale ? "stale" : "missing" };
}

// ---------------------------------------------------------------- prompts

const BASE = `You are writing a CDAF sidecar body: a timestamped text account of this video that an AI agent will read INSTEAD of watching it, possibly many times, for design and editorial decisions. Be objective about what is visible. A verdict is only ever the speaker's own: if nobody says it, write (none spoken), never infer one. Never claim something was finished or achieved unless it is shown. Output ONLY markdown sections, each starting with "## ", in this order, no preamble:

## Summary
One short paragraph: what this video is and what it is useful for.

## Segments
Chronological, contiguous, covering 00:00.0 to the end. One per line, exactly "[MM:SS.d-MM:SS.d] description". Describe what is on screen, what the cursor points at, camera or scroll movement, and any moment someone would cut on or cite.

## Transcript
Every spoken word, one line per utterance: "[MM:SS.d] Speaker: words". Write (no speech) if silent.

## On-screen Text
Visible text that matters (titles, URLs in the address bar, labels, UI copy) with timestamps. Write (none) if there is none.
`;

const TAGS = `
## Tags
One comma-separated line of retrieval keywords: subjects, sites, products, styles, design properties, verdicts.`;

const PROFILES = {
  footage: { detail: "standard", extra: "" },
  feedback: {
    detail: "rich",
    extra: `
## Screen Log
A markdown table: Time | Section on screen | Cursor points at | Short quote | Verdict (LIKE / DISLIKE / CHANGE / NEUTRAL) | Design property.

## Change Requests
One concrete change per line, each with its timestamp.

## Synthesis
What the speaker wants, in a few paragraphs. Their verdicts are the record; this section is a reading of them.`,
  },
  reference: {
    detail: "rich",
    extra: `
## Site Log
A markdown table: Time range | URL read off the address bar | Site or product | On screen | Cursor points at | Quote | Verdict (TARGET / LIKE / DISLIKE / NEUTRAL).

## Properties
The design properties named or shown (layout, spacing, type, corners, diagrams, motion), each with where it was seen.

## Synthesis
What the speaker is pointing at across the references.`,
  },
  diagrams: {
    detail: "rich",
    extra: `
## Diagram Log
Per diagram shown: time range, source, then Construction (projection), Primitives, what carries Meaning, Labels, Datum, Movement, a Quote and a Verdict.

## Rules
The construction rules the speaker's verdicts imply, one per line.

## Synthesis
What the speaker wants the diagram system to be.`,
  },
};

function promptFor(profile, context, duration) {
  const p = PROFILES[profile];
  if (!p)
    throw new Error(`unknown profile "${profile}" (feedback | reference | diagrams | footage)`);
  const ctx =
    (duration ? `\nThe video is ${duration} long; no segment may end after that.\n` : "") +
    (context ? `\nContext from the owner: ${context}\n` : "");
  return BASE + p.extra + TAGS + ctx;
}

// ---------------------------------------------------------------- gemini

function geminiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (!existsSync(ENV_FILE)) throw new Error(`GEMINI_API_KEY not set and ${ENV_FILE} not found`);
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^GEMINI_API_KEY=(.*)$/);
    if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("GEMINI_API_KEY is empty in the canonical .env");
}

const MIME = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  webm: "video/webm",
  avi: "video/x-msvideo",
  m4v: "video/mp4",
};

async function upload(video, key) {
  const bytes = readFileSync(video);
  const mime = MIME[video.split(".").pop().toLowerCase()] ?? "video/mp4";
  const start = await fetch(`${API}/upload/v1beta/files?key=${key}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.length),
      "X-Goog-Upload-Header-Content-Type": mime,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: basename(video) } }),
  });
  const url = start.headers.get("x-goog-upload-url");
  if (!url) throw new Error(`upload start failed: ${start.status} ${await start.text()}`);
  const done = await fetch(url, {
    method: "POST",
    headers: { "X-Goog-Upload-Command": "upload, finalize", "X-Goog-Upload-Offset": "0" },
    body: bytes,
  });
  const { file } = await done.json();
  if (!file?.name) throw new Error("upload finalize returned no file");
  for (let i = 0; i < 60; i++) {
    const st = await (await fetch(`${API}/v1beta/${file.name}?key=${key}`)).json();
    if (st.state === "ACTIVE") return { uri: st.uri, mime };
    if (st.state === "FAILED") throw new Error("Gemini failed to process the video");
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error("video never became ACTIVE");
}

async function describe(file, prompt, model, key) {
  const res = await fetch(`${API}/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { parts: [{ file_data: { mime_type: file.mime, file_uri: file.uri } }, { text: prompt }] },
      ],
    }),
  });
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return { text: text.trim(), usage: json.usageMetadata, error: json.error?.message };
}

function probe(video) {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,r_frame_rate:format=duration",
        "-of",
        "json",
        video,
      ],
      { encoding: "utf8" }
    );
    const j = JSON.parse(out);
    const s = j.streams?.[0] ?? {};
    const [n, d] = String(s.r_frame_rate ?? "")
      .split("/")
      .map(Number);
    return {
      duration: j.format?.duration ? hms(Number(j.format.duration)) : undefined,
      resolution: s.width ? `${s.width}x${s.height}` : undefined,
      fps: n && d ? String(Math.round((n / d) * 100) / 100) : undefined,
    };
  } catch {
    return {};
  }
}

export function libraryName(video, sha) {
  const slug = basename(video)
    .replace(VIDEO_EXT, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}-${sha.slice(0, 8)}.cdaf`;
}

async function generate(video, opts) {
  const existing = await lookup(video);
  if (existing.state === "fresh" && !opts.force) {
    console.log(`FRESH  ${video}\n       ${existing.path} (skipped; --force to regenerate)`);
    return;
  }
  const key = geminiKey();
  const sha = await sha256File(video);
  const bytes = String(statSync(video).size);
  const profile = opts.profile ?? "footage";
  console.log(`READ   ${video} (${(Number(bytes) / 1e6).toFixed(1)} MB, profile ${profile})`);
  const meta = probe(video);
  const prompt = promptFor(profile, opts.context, meta.duration);
  const file = await upload(video, key);
  let model = opts.model ?? DEFAULT_MODEL;
  let out = await describe(file, prompt, model, key);
  if (!out.text && !opts.model) {
    model = FALLBACK_MODEL;
    out = await describe(file, prompt, model, key);
  }
  if (!out.text) throw new Error(`no description: ${out.error ?? "empty candidates"}`);
  const header = {
    video: basename(video),
    sha256: sha,
    bytes,
    ...Object.fromEntries(Object.entries(meta).filter(([, v]) => v)),
    generator: model,
    created: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    detail: PROFILES[profile].detail,
    lang: "en",
    "x-profile": profile,
    "x-source": video,
  };
  const text = serializeCdaf(header, out.text);
  const errs = validateCdaf(parseCdaf(text));
  if (errs.length)
    console.warn(`WARN   model output is not fully conforming:\n       ${errs.join("\n       ")}`);
  mkdirSync(LIBRARY, { recursive: true });
  const libPath = join(LIBRARY, libraryName(video, sha));
  writeFileSync(libPath, text);
  console.log(`WROTE  ${libPath}`);
  if (!opts.noBeside) {
    try {
      writeFileSync(sidecarPathFor(video), text);
      console.log(`WROTE  ${sidecarPathFor(video)}`);
    } catch (e) {
      console.warn(`WARN   could not write beside the video: ${e.message}`);
    }
  }
  if (out.usage)
    console.log(
      `TOKENS prompt ${out.usage.promptTokenCount} · answer ${out.usage.candidatesTokenCount}`
    );
}

// ---------------------------------------------------------------- commands

function parseArgs(argv) {
  const opts = { paths: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") opts.force = true;
    else if (a === "--no-beside") opts.noBeside = true;
    else if (a === "--profile") opts.profile = argv[++i];
    else if (a === "--model") opts.model = argv[++i];
    else if (a === "--context") opts.context = argv[++i];
    else opts.paths.push(a);
  }
  return opts;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const opts = parseArgs(rest);
  if (cmd === "status") {
    let missing = 0;
    for (const p of opts.paths) {
      for (const v of videosUnder(p)) {
        const r = await lookup(v);
        if (r.state !== "fresh") missing++;
        console.log(`${r.state.toUpperCase().padEnd(8)}${v}${r.path ? `\n       ${r.path}` : ""}`);
      }
    }
    process.exit(missing ? 1 : 0);
  } else if (cmd === "read") {
    const r = await lookup(opts.paths[0]);
    if (r.state !== "fresh") {
      console.error(`${r.state.toUpperCase()}: no fresh read of ${opts.paths[0]}`);
      process.exit(1);
    }
    process.stdout.write(`<!-- ${r.path} -->\n${r.parsed.body}\n`);
  } else if (cmd === "find") {
    const words = opts.paths.map((w) => w.toLowerCase());
    for (const f of librarySidecars()) {
      const { header, sections } = parseCdaf(readFileSync(f, "utf8"));
      const hay = readFileSync(f, "utf8").toLowerCase();
      if (!words.every((w) => hay.includes(w))) continue;
      console.log(
        `${f}\n  video: ${header["x-source"] ?? header.video}\n  ${(sections.Summary ?? "").split("\n")[0].slice(0, 200)}`
      );
    }
  } else if (cmd === "generate") {
    for (const p of opts.paths) for (const v of videosUnder(p)) await generate(v, opts);
  } else {
    console.log(
      readFileSync(fileURLToPath(import.meta.url), "utf8")
        .split("\n")
        .slice(1, 19)
        .join("\n")
    );
    process.exit(cmd ? 1 : 0);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
