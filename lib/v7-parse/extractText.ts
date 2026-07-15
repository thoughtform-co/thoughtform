import { join } from "path";

import { parseV7Html } from "./parseBody";
import type { V7CorridorText } from "./types";

/**
 * Pull the corridor's text content out of the v7 prototype HTML so
 * the home-v2 corridor can render it inside the `CopyAnchors`
 * overlay (ADR-018, world-owned model).
 *
 * Mirrors `sliceV7Sections`'s parse pipeline so we operate on the
 * cleaned bodyHtml. Falls back to sensible defaults (the canonical
 * copy hardcoded against the May 2026 prototype snapshot) if a
 * specific field can't be found — keeps the corridor renderable
 * even if the source markup drifts.
 */
export function extractV7Text(): V7CorridorText {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-v7-motion.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  let bodyHtml = "";
  try {
    bodyHtml = parseV7Html(htmlPath, tokensPath).bodyHtml;
  } catch {
    bodyHtml = "";
  }

  const tfMatch = /<section\b[^>]*\bid="definition"[^>]*>([\s\S]*?)<\/section>/i.exec(bodyHtml);
  const dgMatch = /<section\b[^>]*\bid="missing-layer"[^>]*>([\s\S]*?)<\/section>/i.exec(bodyHtml);
  const ilMatch = /<section\b[^>]*\bid="intelligence-layer"[^>]*>([\s\S]*?)<\/section>/i.exec(
    bodyHtml
  );
  const tfHtml = tfMatch ? tfMatch[1] : "";
  const dgHtml = dgMatch ? dgMatch[1] : "";
  const ilHtml = ilMatch ? ilMatch[1] : "";

  // ── Thoughtform (definition) ───────────────────────────────────
  const tfBridge =
    innerHtmlForClass(tfHtml, "div", "tri__ipa") ?? "THOUGHTFORM /θɔːtfɔːrm · THAWT-form/";
  const tfTitle =
    innerHtmlForClass(tfHtml, "h2", "tri__title") ??
    "AI collapsed the distance between <em>thought</em> and <em>form</em>.";
  const tfBody1 =
    innerHtmlForClass(tfHtml, "p", "tri__title--secondary", 0) ??
    "But AI still does not know your work.";
  const tfBody2 =
    innerHtmlForClass(tfHtml, "p", "tri__title--secondary", 1) ??
    "Context is the new frontier; and every platform wants to capture it.";
  const tfBody3 =
    innerHtmlForClass(tfHtml, "p", "tri__title--secondary", 2) ??
    "We help your team own yours, then build from it.";
  const tfCtaMatch = /<a\b[^>]*\bclass="[^"]*\bbtn--solid\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(
    tfHtml
  );
  const tfCta = tfCtaMatch ? stripTags(tfCtaMatch[1]) : "Enter the arc";

  // North star caption.
  const tfNorthMatch = /<div\b[^>]*\bclass="[^"]*\bsigil__cap\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(
    tfHtml
  );
  let tfNorthTitle = "North star";
  let tfNorthDesc = "the interface, not the algorithm";
  if (tfNorthMatch) {
    const inner = tfNorthMatch[1];
    const k = /<span\b[^>]*\bclass="k"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    const v = /<span\b[^>]*\bclass="v"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    if (k) tfNorthTitle = stripTags(k[1]);
    if (v) tfNorthDesc = stripTags(v[1]);
  }

  // ── Diagnostic (missing-layer) ─────────────────────────────────
  const dgTitle =
    innerHtmlForClass(dgHtml, "h2", "miss__title") ??
    "The missing layer is rarely <em>the model.</em>";
  const dgBridge = stripTags(
    innerHtmlForClass(dgHtml, "p", "miss__bridge") ?? "Same pattern, four ways."
  );
  const dgLabels = extractMissLabels(dgHtml);
  const fallbackLabels: V7CorridorText["diagnostic"]["labels"] = [
    { id: "01", n: "01", tag: "Brand voice drifts across every channel." },
    { id: "02", n: "02", tag: "Creative briefs arrive without the thinking." },
    { id: "03", n: "03", tag: "Every product concept looks feasible." },
    { id: "04", n: "04", tag: "Customer service depends on who picks up." },
  ];
  const diagnosticLabels = dgLabels.length === 4 ? dgLabels : fallbackLabels;

  // ── Intelligence layer ─────────────────────────────────────────
  const ilTitle =
    innerHtmlForClass(ilHtml, "h2", "ilayer__title") ??
    "The fix is an<br><em>intelligence layer.</em>";
  const ilLede =
    innerHtmlForClass(ilHtml, "p", "ilayer__lede") ??
    "The intelligence layer sits in the middle. When sources and surfaces dock around it, the full <em>stack</em> lives.";
  const ilLeft = stripTags(
    innerHtmlForId(ilHtml, "h3", "ilayer-chamber-sources") ?? "Trusted sources"
  );
  const ilRight = stripTags(
    innerHtmlForId(ilHtml, "h3", "ilayer-chamber-surfaces") ?? "Headless surfaces"
  );

  return {
    thoughtform: {
      bridge: stripTags(tfBridge),
      titleHtml: tfTitle.trim(),
      body1Html: tfBody1.trim(),
      body2Html: tfBody2.trim(),
      body3Html: tfBody3.trim(),
      cta: tfCta,
      northStarTitle: tfNorthTitle,
      northStarDesc: tfNorthDesc,
      phaseLabels: { navigate: "Navigate", encode: "Encode", build: "Build" },
    },
    diagnostic: {
      titleHtml: dgTitle.trim(),
      bridge: dgBridge,
      labels: diagnosticLabels,
    },
    intelligence: {
      titleHtml: ilTitle.trim(),
      ledeHtml: ilLede.trim(),
      leftLabel: ilLeft,
      rightLabel: ilRight,
    },
  };
}

// ────────────────────────────────────────────────────────────────
// Helpers (kept private to this module — `extractV7Text` is the
// single export used by `getV7Content`'s callers)
// ────────────────────────────────────────────────────────────────

/** Strip all HTML tags + collapse whitespace. */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Capture the inner HTML of the first element matching a tag with
 *  the given class on it. Class match is "contains the className as a
 *  whole-word token". */
function innerHtmlForClass(
  html: string,
  tag: string,
  className: string,
  occurrence = 0
): string | null {
  const re = new RegExp(
    `<${tag}\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)</${tag}>`,
    "gi"
  );
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(html)) !== null) {
    if (i === occurrence) return m[1];
    i += 1;
  }
  return null;
}

/** Inner HTML by element id. */
function innerHtmlForId(html: string, tag: string, id: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = re.exec(html);
  return m ? m[1] : null;
}

/** Capture each `class="miss__label--N"` block + its tag text. */
function extractMissLabels(html: string) {
  const out: { id: "01" | "02" | "03" | "04"; n: string; tag: string }[] = [];
  for (const id of ["01", "02", "03", "04"] as const) {
    const re = new RegExp(
      `<a\\b[^>]*\\bclass="[^"]*\\bmiss__label--${id}\\b[^"]*"[^>]*>([\\s\\S]*?)</a>`,
      "i"
    );
    const m = re.exec(html);
    if (!m) continue;
    const inner = m[1];
    const nMatch =
      /<span\b[^>]*\bclass="[^"]*\bmiss__label-n\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    const tagMatch =
      /<span\b[^>]*\bclass="[^"]*\bmiss__label-tag\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    out.push({
      id,
      n: nMatch ? stripTags(nMatch[1]) : id,
      tag: tagMatch ? stripTags(tagMatch[1]) : "",
    });
  }
  return out;
}
