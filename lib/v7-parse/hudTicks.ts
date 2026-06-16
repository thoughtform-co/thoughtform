/**
 * Static depth-gauge tick markup for the left and right HUD rails.
 *
 * The prototype HTML ships empty `<div id="leftTicks"></div>` /
 * `<div id="rightTicks"></div>` shells; the parser injects a fully
 * built tick ladder into them so the rails render the same way they
 * do in the standalone prototype. The labels were originally driven
 * by JavaScript at runtime — keeping the markup static avoids a
 * client-side reflow on first paint.
 */

const TICK_COUNT = 20;

const TICK_LABELS: Record<number, string> = {
  0: "0",
  5: "2",
  10: "5",
  15: "7",
  20: "10",
};

/** Build a single rail's full tick ladder as a single HTML string. */
export function buildDepthTicksHtml(): string {
  let html = "";
  for (let i = 0; i <= TICK_COUNT; i += 1) {
    const isMajor = i % 5 === 0;
    const topPct = ((i / TICK_COUNT) * 100).toFixed(4);
    const cls = "hud__rail__tick" + (isMajor ? " hud__rail__tick--major" : "");
    html += `<div class="${cls}" style="top:${topPct}%"></div>`;
    if (isMajor && TICK_LABELS[i] !== undefined) {
      html += `<div class="hud__rail__label" style="top:${topPct}%;transform:translateY(-50%)">${TICK_LABELS[i]}</div>`;
    }
  }
  return html;
}

/** Inject the same ladder into both `#leftTicks` and `#rightTicks`
 *  if they are present in the body markup. */
export function injectStaticHudChildren(html: string): string {
  const ticksHtml = buildDepthTicksHtml();
  return html
    .replace(/<div id="leftTicks"><\/div>/, `<div id="leftTicks">${ticksHtml}</div>`)
    .replace(/<div id="rightTicks"><\/div>/, `<div id="rightTicks">${ticksHtml}</div>`);
}
