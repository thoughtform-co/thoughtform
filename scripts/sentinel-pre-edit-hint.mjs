#!/usr/bin/env node
/**
 * Cursor preToolUse hook: when a file write is about to happen, print a one-line
 * Sentinel hint if the path matches a path-scoped rule.
 * Stdin: JSON payload (shape varies by Cursor version) — we walk for path-like strings.
 * Stdout: JSON { "permission": "allow", "agent_message": "..." } or {}
 */
import { readFileSync } from "fs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function normalize(p) {
  if (!p || typeof p !== "string") return "";
  return p.replace(/\\/g, "/");
}

function extractCandidatePaths(value, out, depth = 0) {
  if (depth > 12) return;
  if (!value) return;
  if (typeof value === "string") {
    if (
      (value.includes("/") || value.includes("\\")) &&
      /\.(tsx?|jsx?|mdc?|md|css|json|sql|html|sh)$/i.test(value)
    ) {
      out.add(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) extractCandidatePaths(v, out, depth + 1);
    return;
  }
  if (typeof value === "object") {
    for (const k of [
      "file_path",
      "path",
      "filePath",
      "targetFile",
      "file",
      "uri",
    ]) {
      if (typeof value[k] === "string") out.add(value[k]);
    }
    for (const v of Object.values(value)) extractCandidatePaths(v, out, depth + 1);
  }
}

const rules = [
  {
    test: (p) =>
      p.includes("components/landing/v7/") || p.includes("app/(marketing)/"),
    line:
      "Sentinel: landing v7 / marketing — read ADR-008 + ADR-010; .claude/skills/landing-v7-compositing + brandmark-choreography; sentinel/MAINTENANCE.md",
  },
  {
    test: (p) =>
      /useSigilChoreography/i.test(p) ||
      /BrandmarkActor/i.test(p) ||
      p.endsWith("components/landing/v7/landing.css"),
    line:
      "Sentinel: brandmark choreography — ADR-010 + brandmark-choreography skill; live rects, no HUD pin at scrollY=0 on refresh; sentinel/MAINTENANCE.md",
  },
  {
    test: (p) =>
      p.includes("lib/hooks/useScroll") ||
      p.includes("components/hud/NavigationCockpitV2/hooks/"),
    line:
      "Sentinel: scroll / cockpit hooks — ADR-002, ADR-005; sentinel/MAINTENANCE.md",
  },
  {
    test: (p) =>
      p.includes("lib/auth/") ||
      p.includes("components/auth/") ||
      p.includes("app/api/"),
    line:
      "Sentinel: auth + API — ADR-003, isAllowedUserEmail(); server-side validation; sentinel/MAINTENANCE.md",
  },
  {
    test: (p) => p.includes("supabase/") || p.includes("lib/celestial/"),
    line: "Sentinel: Supabase / celestial — CLAUDE.md migration naming + RLS; sentinel/MAINTENANCE.md",
  },
];

const raw = readStdin();
let data = {};
try {
  data = raw ? JSON.parse(raw) : {};
} catch {
  process.stdout.write("{}\n");
  process.exit(0);
}

const candidates = new Set();
extractCandidatePaths(data, candidates);

const messages = [];
for (const c of candidates) {
  const p = normalize(c);

  for (const { test, line } of rules) {
    if (test(p)) {
      if (!messages.includes(line)) messages.push(line);
    }
  }
}

if (messages.length === 0) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const agent_message = messages.join("\n");
process.stdout.write(
  JSON.stringify({ permission: "allow", agent_message }) + "\n"
);
