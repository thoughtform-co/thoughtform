/**
 * The talk's order (ADR-156 U2, owner 2026-10-15): the hero, the About, the
 * eras, THEN THE TALK, and the thesis and the Arc at the end.
 *
 * The shared prototype puts `#workshop` (the station the talk mounts into)
 * after the proof pile. This moves it, at parse time and after the parse
 * cache, to sit directly before the corridor mount, so the page reads
 * eras → talk → thesis → Arc → proof → contact. Pure string surgery in
 * `equilibrium.ts`'s manner: every miss THROWS, so a changed prototype can
 * never silently ship the old order.
 *
 * ⚠ THE KILL EDGE TRAVELS TOO. `#workshop` carries `data-corridor-kill`, the
 * first opaque station BELOW the corridor, which `useCorridorExitScroll`
 * reads first. Left on the talk, now ABOVE the corridor, the edge would sit
 * at a negative offset and the ambient would never hold behind the proof;
 * it moves to `#contact`, which is the first station below it now.
 *
 * ⚠ AND THE HERO'S PRIMARY CTA, which points at the corridor mount: on this
 * page the first thing after the eras is the talk.
 *
 * The eras must not open the corridor either: the page passes
 * `useWorkshopFlow({ seam: false })`, which this move depends on.
 */

const TALK_ID = "workshop";
const KILL_ATTR = "data-corridor-kill";

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The one `<section id="…">` block, nested sections included. */
function sectionBlock(html: string, id: string): { start: number; end: number; open: string } {
  const openRe = new RegExp(`<section\\b[^>]*\\bid="${escape(id)}"[^>]*>`, "g");
  const opens = [...html.matchAll(openRe)];
  if (opens.length !== 1) {
    throw new Error(`[ux-meetup order] expected one #${id} section, found ${opens.length}`);
  }
  const start = opens[0].index ?? 0;
  const tagRe = /<section\b|<\/section>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    depth += m[0] === "</section>" ? -1 : 1;
    if (depth === 0) return { start, end: m.index + m[0].length, open: opens[0][0] };
  }
  throw new Error(`[ux-meetup order] #${id} is never closed`);
}

export function moveTalkBeforeCorridor(bodyHtml: string, mountId: string): string {
  const talk = sectionBlock(bodyHtml, TALK_ID);
  if (!new RegExp(`\\s${KILL_ATTR}\\b`).test(talk.open)) {
    throw new Error(`[ux-meetup order] #${TALK_ID} no longer carries ${KILL_ATTR}`);
  }
  const mountRe = new RegExp(`<div\\s+id="${escape(mountId)}"[^>]*></div>`, "g");
  const mounts = [...bodyHtml.matchAll(mountRe)];
  if (mounts.length !== 1) {
    throw new Error(`[ux-meetup order] expected one #${mountId} mount, found ${mounts.length}`);
  }
  if ((mounts[0].index ?? 0) > talk.start) {
    throw new Error(`[ux-meetup order] #${TALK_ID} already sits before the corridor`);
  }

  const block = bodyHtml
    .slice(talk.start, talk.end)
    .replace(talk.open, talk.open.replace(new RegExp(`\\s${KILL_ATTR}\\b`), ""));
  let html = bodyHtml.slice(0, talk.start) + bodyHtml.slice(talk.end);
  html = html.replace(mountRe, (mount) => `${block}\n${mount}`);

  const contact = sectionBlock(html, "contact");
  if (new RegExp(`\\s${KILL_ATTR}\\b`).test(contact.open)) {
    throw new Error(`[ux-meetup order] #contact already carries ${KILL_ATTR}`);
  }
  html = html.replace(contact.open, contact.open.replace(/>$/, ` ${KILL_ATTR}>`));

  const cta = `href="#${mountId}"`;
  const ctas = html.split(cta).length - 1;
  if (ctas !== 1) {
    throw new Error(`[ux-meetup order] expected one hero link to the corridor, found ${ctas}`);
  }
  return html.replace(cta, `href="#${TALK_ID}"`);
}
