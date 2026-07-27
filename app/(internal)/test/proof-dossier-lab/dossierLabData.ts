import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type {
  DossierContent,
  DossierStat,
} from "@/components/landing/home-v2/services/dossier/dossierTypes";
import { PROOF_CASE } from "@/lib/cases/registry";

/**
 * Lab content for the proof dossier.
 *
 * The real case is IMPORTED, never copied — `PROOF_CASE` supplies the meta
 * register, the shipped stats and every phase's rows, and `PROJECT_CASES`
 * supplies the tool strip, so nothing the lab shows can drift from what the
 * site publishes elsewhere.
 *
 * What lives here is only what the dossier FORMAT needs and the case data
 * does not yet carry: the title-bar identity, the condensed summary, the
 * per-phase pattern line, and one receipt per phase. Those are condensations
 * of copy already in `PROOF_CASE` — no new claims, no new numbers. Promote
 * them into `lib/cases/` as a `CaseDossier` field on `CaseDef` when the
 * design is settled; `lib/cases/types.ts` keeps zero imports, so they must
 * stay plain data when they move.
 *
 * ⚠ CONFIDENTIALITY. Lab screenshots travel — everything below is inside the
 * `.claude/rules/proof.md` envelope: no money, no board or repo links, first
 * names only. Where a figure is already published on another surface it is
 * printed at the SAME value.
 */

/** Title-bar identity + the condensed lines the dossier format needs. */
const DOSSIER_EXTRAS = {
  mark: "TF // FIELD REPORT",
  case: "CASE 01 — LOOP EARPLUGS",
  caseLabel: "Case 01 — Loop Earplugs",
  state: "LIVE",
  /**
   * One-sentence form of `PROOF_CASE.report.lede` (283 chars is a station
   * lede; a window needs a line). Same three claims, same order.
   */
  summary:
    "Eighteen months embedded in one company: every team briefed on the same frame, the judgment encoded as Skills they own, and the tools they now run daily built where software never fit.",
  /** Per-phase pattern lines — first-sentence condensations of each beat. */
  pattern: {
    navigate:
      "Every team gets the same forty-five minute kickoff and the same starting question: where does the work actually happen.",
    encode:
      "What surfaces in a workshop becomes a Skill — versioned, reviewed, and owned by the team rather than the person who wrote it.",
    build:
      "A tool built with the team that owns the workflow, standing on the Skills they already authored.",
  },
  /**
   * One receipt per phase. Navigate and Build take the case's own first
   * receipt verbatim; Encode has none in the case data, so it takes the
   * claim from that beat's second body paragraph.
   */
  receipt: {
    navigate: PROOF_CASE.beats[0].receipts?.[0] ?? "",
    encode: "Five recurring shapes of work underneath all forty-two",
    build: PROOF_CASE.beats[2].receipts?.[0] ?? "",
  },
  /**
   * The IMPACT stat set (outcome-first), as opposed to the shipped
   * activity-first tiles on `PROOF_CASE.report.stats`. The console toggles
   * between them because which set belongs in a 15-second read is a content
   * decision, not a layout one.
   *
   * ⚠ The 95% tile is BRIEFINGS, not paid social. `lib/arcs/content/
   * ai-keynote.ts` publishes exactly one 95% claim — "95% of briefings done
   * with AI" — and `/test/proof-highlight-lab`'s extras attach that number to
   * paid social instead, which is the same figure wearing a different subject.
   * The house rule forbids a second variant of a published claim, so this
   * surface mirrors the published one verbatim. Do not "restore" the
   * paid-social wording from the older lab.
   */
  impactStats: [
    { value: "04", label: "AI tools", detail: "in production" },
    { value: "20+", label: "workflows", detail: "encoded as Skills" },
    { value: "10+", label: "teams", detail: "self-sufficient" },
    { value: "95%", label: "of briefings", detail: "done with AI" },
  ] as readonly DossierStat[],
} as const;

/** Which stat register the window prints. */
export type StatSet = "shipped" | "impact";

/** Rollout-log rows worth the excerpt: the start, the pilot, and where it
 *  landed — the arc of the beat in three lines. */
const NAVIGATE_ROW_PICKS = [0, 1, 5] as const;

export function buildDossierContent(statSet: StatSet): DossierContent {
  const [navigate, encode, build] = PROOF_CASE.beats;
  const logRows = navigate.visual.kind === "log" ? navigate.visual.rows : [];
  const regRows = encode.visual.kind === "registry" ? encode.visual.rows : [];
  const toolIds = build.visual.kind === "tool-strip" ? build.visual.toolIds : [];

  const stats: readonly DossierStat[] =
    statSet === "impact"
      ? DOSSIER_EXTRAS.impactStats
      : PROOF_CASE.report.stats.map((s) => ({
          value: s.value,
          label: s.label,
          detail: s.detail,
        }));

  return {
    slug: PROOF_CASE.slug,
    bar: {
      mark: DOSSIER_EXTRAS.mark,
      case: DOSSIER_EXTRAS.case,
      state: DOSSIER_EXTRAS.state,
    },
    caseLabel: DOSSIER_EXTRAS.caseLabel,
    meta: PROOF_CASE.report.meta.map((row) => ({ label: row.label, value: row.value })),
    summary: DOSSIER_EXTRAS.summary,
    stats,
    phases: [
      {
        id: navigate.id,
        num: "01",
        name: "NAVIGATE",
        desig: "PRF / NAVIGATE · 01",
        pattern: DOSSIER_EXTRAS.pattern.navigate,
        receipt: DOSSIER_EXTRAS.receipt.navigate,
        excerpt: {
          kind: "log",
          title: "Rollout log",
          rows: NAVIGATE_ROW_PICKS.map((i) => logRows[i]).filter(Boolean),
        },
      },
      {
        id: encode.id,
        num: "02",
        name: "ENCODE",
        desig: "PRF / ENCODE · 02",
        pattern: DOSSIER_EXTRAS.pattern.encode,
        receipt: DOSSIER_EXTRAS.receipt.encode,
        excerpt: {
          kind: "registry",
          title: "Skills registry · 42 in motion",
          rows: regRows
            .slice(0, 3)
            .map((row) => ({ team: row.team, name: row.name, tag: row.tag })),
        },
      },
      {
        id: build.id,
        num: "03",
        name: "BUILD",
        desig: "PRF / BUILD · 03",
        pattern: DOSSIER_EXTRAS.pattern.build,
        receipt: DOSSIER_EXTRAS.receipt.build,
        excerpt: {
          kind: "tools",
          title: "Four, in production daily",
          rows: toolIds
            .map((id) => PROJECT_CASES.find((p) => p.id === id))
            .filter((tool): tool is (typeof PROJECT_CASES)[number] => Boolean(tool))
            .map((tool) => ({ codename: tool.codename, tagline: tool.tagline })),
        },
      },
    ],
  };
}
