/**
 * Brand Codex HUD rail tick ladders (left + right).
 *
 * Canonical source: Brand Codex design file XO8yGN90SfxiG1hmYPGYXn,
 * node 1767:2327 (TEXT+IMG 1b specimen). Mirrors the contract used by
 * the Astrolabe runtime in
 *   ../../02_astrolabe.thoughtform/lib/navigation/rail-contract.ts
 *
 * Each rail carries 13 equal-spacing tick positions (0%, 8.33%, …,
 * 100%) over the rail-aside height:
 *
 *   - LEFT rail: 13 ticks. The 8.33% slot was originally skipped
 *     ("reserved for the compass waypoint"), but the travelling depth
 *     diamond never parks there and the double-width gap read as a
 *     MISSING tick (owner, 2026-07-11) — the ladder now matches the
 *     right rail. Majors at 33.33% and 66.67%, labelled "2" and "5".
 *   - RIGHT rail: 13 ticks. Majors at 33.33% and 66.67%, no labels.
 *
 * Widths: 7px minor, 21px major. CSS handles the outward extension
 * from the guide (left rail extends LEFT, right rail extends RIGHT).
 *
 * The prototype HTML ships empty `<div id="leftTicks">` / `<div
 * id="rightTicks">` shells; this module injects each side's ladder
 * at parse time so the rails render the Brand Codex contract on
 * first paint without a client-side reflow.
 */

interface TickMark {
  yPct: number;
  major: boolean;
  /** Optional bearing label rendered just inside the rail. */
  label?: string;
}

const LEFT_TICKS: readonly TickMark[] = [
  { yPct: 0, major: false },
  { yPct: 8.33, major: false },
  { yPct: 16.67, major: false },
  { yPct: 25, major: false },
  { yPct: 33.33, major: true, label: "2" },
  { yPct: 41.67, major: false },
  { yPct: 50, major: false },
  { yPct: 58.33, major: false },
  { yPct: 66.67, major: true, label: "5" },
  { yPct: 75, major: false },
  { yPct: 83.33, major: false },
  { yPct: 91.67, major: false },
  { yPct: 100, major: false },
];

const RIGHT_TICKS: readonly TickMark[] = [
  { yPct: 0, major: false },
  { yPct: 8.33, major: false },
  { yPct: 16.67, major: false },
  { yPct: 25, major: false },
  { yPct: 33.33, major: true },
  { yPct: 41.67, major: false },
  { yPct: 50, major: false },
  { yPct: 58.33, major: false },
  { yPct: 66.67, major: true },
  { yPct: 75, major: false },
  { yPct: 83.33, major: false },
  { yPct: 91.67, major: false },
  { yPct: 100, major: false },
];

function buildRailHtml(ticks: readonly TickMark[]): string {
  let html = "";
  for (const tick of ticks) {
    const cls = "hud__rail__tick" + (tick.major ? " hud__rail__tick--major" : "");
    const top = tick.yPct.toFixed(4);
    html += `<div class="${cls}" style="top:${top}%"></div>`;
    if (tick.label !== undefined) {
      html += `<div class="hud__rail__label" style="top:${top}%;transform:translateY(-50%)">${tick.label}</div>`;
    }
  }
  return html;
}

/** Build the LEFT rail tick ladder as a single HTML string. */
export function buildLeftRailTicksHtml(): string {
  return buildRailHtml(LEFT_TICKS);
}

/** Build the RIGHT rail tick ladder as a single HTML string. */
export function buildRightRailTicksHtml(): string {
  return buildRailHtml(RIGHT_TICKS);
}

/**
 * @deprecated Use `buildLeftRailTicksHtml` / `buildRightRailTicksHtml`.
 * Kept as an alias of the left-rail builder for any external caller
 * that hard-coded the old single-ladder name.
 */
export function buildDepthTicksHtml(): string {
  return buildLeftRailTicksHtml();
}

/** Inject the per-side ladders into `#leftTicks` and `#rightTicks`
 *  if they are present in the body markup. */
export function injectStaticHudChildren(html: string): string {
  return html
    .replace(/<div id="leftTicks"><\/div>/, `<div id="leftTicks">${buildLeftRailTicksHtml()}</div>`)
    .replace(
      /<div id="rightTicks"><\/div>/,
      `<div id="rightTicks">${buildRightRailTicksHtml()}</div>`
    );
}
