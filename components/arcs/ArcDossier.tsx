import {
  CASE_TOTAL,
  PROJECT_CASES,
  type CaseMode,
  type ProjectCase,
} from "@/components/landing/v7/tools-cards/toolCardData";
import type { ArcHead, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcDossierConsole } from "./ArcDossierConsole";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText, segmentsToArcTitle } from "./chrome";

interface ArcDossierProps {
  section: ArcSectionOf<"dossier">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcDossier — one production tool, one full-viewport beat (ADR-072).
 *
 * The casefile's tool dossier, let out of its panel: the RECORD on the
 * left (the tool's own canonical fields — mode, team, status, the friction
 * it removed and what changed, the route it collapsed, the stack) beside
 * the CONSOLE on the right — the same `ConsoleFrame` + `ToolField` the
 * landing mounts, at page scale: the authored wireframe ~2× its panel
 * area, the fused "Watch walkthrough" bar opening the same lightbox, the
 * four capability blocks beneath.
 *
 * ONE SOURCE. Nothing here is re-typed: the masthead derives from the
 * record (`codename · tagline` eyebrow, the em-segmented title), the
 * legend is the shared mode sentence, and every other string is
 * `PROJECT_CASES`' — inside the casefile's confidentiality envelope by
 * construction. The content module contributes a `toolId`, which is what
 * makes the dossier a TEMPLATE rather than a page.
 *
 * THE ROUTE RETURNS AS A NEW DRAWING (ADR-068 U3 held the data for one):
 * a vertical chain of the steps the work used to move through, one mono
 * cell each on a spine, and the single cell they collapsed into. DOM, not
 * SVG, and vertical because the record column is ~400px wide while five
 * 12-character cells need ~480 in a row.
 *
 * Terminal rungs: the head is the still masthead (0.06) and the ONLY
 * decode target — nothing in the console decodes, the wireframe's labels
 * are `aria-hidden` spans the controller never sees; the console is an
 * APERTURE (0.12, the media/portrait frame recipe — a centre-slit unfold,
 * no travel, `transform: none`, so the wrapper never becomes a containing
 * block); the record panels ladder in from the left (0.18 → 0.38) and so
 * leave FIRST on the fold — the instrument outlives its content.
 */
export function ArcDossier({ section, index, motion = "reveal" }: ArcDossierProps) {
  const tool = resolveDossierTool(section.toolId);
  // Unreachable on a registered arc — `tests/lib/arcs-registry.test.ts`
  // pins every `toolId` to a record — but a null render beats a throw
  // inside a static build.
  if (!tool) return null;
  const head = section.head ?? dossierHead(tool);
  const terminal = motion === "terminal";
  const mode = caseModeLabel(tool.mode);
  return (
    <ArcBeat
      id={section.id}
      kind="dossier"
      className="arc-section arc-sec arc-sec--dossier"
      ariaLabel={section.ariaLabel ?? `${arcTitleText(head.title)} — ${tool.codename}`}
      motion={motion}
    >
      <div className="arc-band arc-band--instrument">
        <div className="arc-dossier">
          <div className="arc-dossier__record">
            <ArcSectionHead
              head={head}
              kind="dossier"
              index={index}
              sectionId={section.id}
              motion={motion}
            />

            <p className="arc-dossier__mode arc-reveal" {...rung(motion, 0.18, -36)}>
              <span className="arc-badge">
                <i className="arc-badge__dia" aria-hidden="true" />
                {mode}
              </span>
              <span className="arc-dossier__legend">{section.legend}</span>
            </p>

            {/* Team and the record's one metric. NO status row: every record is
                Production and the bay's FEED line already letters IN SERVICE —
                a second home for the same fact is this surface's said-twice. */}
            <dl className="arc-dossier__meta arc-reveal" {...rung(motion, 0.23, -36)}>
              <div className="arc-dossier__meta-row">
                <dt>Team</dt>
                <dd>{tool.team}</dd>
              </div>
              {tool.metric ? (
                <div className="arc-dossier__meta-row">
                  <dt>{tool.metric.label}</dt>
                  <dd>{tool.metric.value}</dd>
                </div>
              ) : null}
            </dl>

            <div className="arc-dossier__brief arc-reveal" {...rung(motion, 0.28, -36)}>
              <p className="arc-dossier__brief-row">
                <span className="arc-desig arc-dossier__key">Before</span>
                <span className="arc-prose arc-dossier__copy">{tool.challenge}</span>
              </p>
              <p className="arc-dossier__brief-row">
                <span className="arc-desig arc-dossier__key">Now</span>
                <span className="arc-prose arc-dossier__copy">{tool.shift}</span>
              </p>
            </div>

            <div className="arc-dossier__route arc-reveal" {...rung(motion, 0.33, -36)}>
              <div className="arc-dossier__route-col">
                <span className="arc-desig arc-dossier__key">The route, before</span>
                <ol className="arc-dossier__chain">
                  {tool.route.before.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <span className="arc-dossier__route-meta">{tool.route.beforeMeta}</span>
              </div>
              <i className="arc-dossier__route-arrow" aria-hidden="true" />
              <div className="arc-dossier__route-col arc-dossier__route-col--now">
                <span className="arc-desig arc-dossier__key">Now</span>
                <span className="arc-dossier__now">{tool.route.now}</span>
                <span className="arc-dossier__route-meta">{tool.route.nowMeta}</span>
              </div>
            </div>

            <ul className="arc-dossier__stack arc-reveal" {...rung(motion, 0.38, -36)}>
              {tool.stack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {/* THE CONSOLE — an aperture, never a travelling panel: the
              casefile's bay needs a definite box to size its drawing
              against (`.fl-wire__in` is a size container), and a
              transformed wrapper would become the containing block the
              lightbox's portal exists to escape. */}
          <div
            className={`arc-dossier__console${terminal ? " arc-ap" : ""}`}
            {...rung(motion, 0.12)}
          >
            <ArcDossierConsole tool={tool} />
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}

/** The record a dossier section points at, or undefined for a bad id. */
export function resolveDossierTool(toolId: string): ProjectCase | undefined {
  return PROJECT_CASES.find((tool) => tool.id === toolId);
}

/** The derived masthead: `01 / 04 · Mímir · Brand Intelligence` over the tool's name. */
export function dossierHead(tool: ProjectCase): ArcHead {
  return {
    eyebrow: `${tool.index} / ${CASE_TOTAL} · ${tool.codename} · ${tool.tagline}`,
    title: segmentsToArcTitle(tool.title),
  };
}

/** `INVENT` → `Invent` — the mode as it reads on a page (and as `MODE_LEGEND` keys it). */
export function caseModeLabel(mode: CaseMode): "Compress" | "Repair" | "Invent" {
  return (mode.charAt(0) + mode.slice(1).toLowerCase()) as "Compress" | "Repair" | "Invent";
}
