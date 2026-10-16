/**
 * The keynote's order (ADR-159, owner 2026-10-16): the hero, the About, the
 * eras, THEN THE TALK, then the swarm chapter, and the thesis and the Arc at
 * the end.
 *
 * The talk's move is the UX meetup's (ADR-156 U2), copied rather than
 * imported for v2's reason: the page order IS this file. The shared
 * prototype puts `#workshop` after the proof pile; this moves it, at parse
 * time and after the parse cache, to sit directly before the corridor mount.
 * Pure string surgery in `equilibrium.ts`'s manner: every miss THROWS, so a
 * changed prototype can never silently ship the old order.
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
 * ⚠ THE SWARM SITS AFTER THE TALK (owner, 2026-10-16: the chapter "should
 * actually come much later"; "let's see how we can integrate the swarm into
 * our narrative"). Its slot is inserted directly before the corridor mount,
 * once the talk stands there, so the page reads
 * eras → talk → swarm → thesis → Arc → proof → contact. On the UX meetup it
 * stood between the eras and the talk (ADR-156 U10).
 *
 * The eras must not open the corridor either: the page passes
 * `useWorkshopFlow({ seam: false })`, which this move depends on.
 */

const TALK_ID = "workshop";
const KILL_ATTR = "data-corridor-kill";
const SWARM_ID = "kta-swarm";

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The one `<section id="…">` block, nested sections included. */
function sectionBlock(html: string, id: string): { start: number; end: number; open: string } {
  const openRe = new RegExp(`<section\\b[^>]*\\bid="${escape(id)}"[^>]*>`, "g");
  const opens = [...html.matchAll(openRe)];
  if (opens.length !== 1) {
    throw new Error(`[keynote order] expected one #${id} section, found ${opens.length}`);
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
  throw new Error(`[keynote order] #${id} is never closed`);
}

/** The one corridor mount, and where it stands. */
function mountOf(html: string, mountId: string): { re: RegExp; at: number } {
  const re = new RegExp(`<div\\s+id="${escape(mountId)}"[^>]*></div>`, "g");
  const mounts = [...html.matchAll(re)];
  if (mounts.length !== 1) {
    throw new Error(`[keynote order] expected one #${mountId} mount, found ${mounts.length}`);
  }
  return { re, at: mounts[0].index ?? 0 };
}

export function moveTalkBeforeCorridor(bodyHtml: string, mountId: string): string {
  const talk = sectionBlock(bodyHtml, TALK_ID);
  if (!new RegExp(`\\s${KILL_ATTR}\\b`).test(talk.open)) {
    throw new Error(`[keynote order] #${TALK_ID} no longer carries ${KILL_ATTR}`);
  }
  const mount = mountOf(bodyHtml, mountId);
  if (mount.at > talk.start) {
    throw new Error(`[keynote order] #${TALK_ID} already sits before the corridor`);
  }

  const block = bodyHtml
    .slice(talk.start, talk.end)
    .replace(talk.open, talk.open.replace(new RegExp(`\\s${KILL_ATTR}\\b`), ""));
  let html = bodyHtml.slice(0, talk.start) + bodyHtml.slice(talk.end);
  html = html.replace(mount.re, (m) => `${block}\n${m}`);

  const contact = sectionBlock(html, "contact");
  if (new RegExp(`\\s${KILL_ATTR}\\b`).test(contact.open)) {
    throw new Error(`[keynote order] #contact already carries ${KILL_ATTR}`);
  }
  html = html.replace(contact.open, contact.open.replace(/>$/, ` ${KILL_ATTR}>`));

  const cta = `href="#${mountId}"`;
  const ctas = html.split(cta).length - 1;
  if (ctas !== 1) {
    throw new Error(`[keynote order] expected one hero link to the corridor, found ${ctas}`);
  }
  return html.replace(cta, `href="#${TALK_ID}"`);
}

/**
 * The swarm chapter's slot, directly before the corridor mount and so after
 * the talk, which must already stand there (`moveTalkBeforeCorridor` first).
 * The chapter itself is a nested root (`SwarmChapter`, mounted by the
 * portals). Throws on a miss, on a talk still below the corridor, and on a
 * second pass.
 */
export function insertSwarmBeforeCorridor(bodyHtml: string, mountId: string): string {
  if (bodyHtml.includes(`id="${SWARM_ID}"`)) {
    throw new Error(`[keynote order] #${SWARM_ID} is already in place`);
  }
  const mount = mountOf(bodyHtml, mountId);
  const talk = sectionBlock(bodyHtml, TALK_ID);
  if (talk.start > mount.at) {
    throw new Error(`[keynote order] #${TALK_ID} must sit before the corridor before the swarm goes in`);
  }
  const slot = `<section id="${SWARM_ID}" class="kta-swarm" aria-label="AI capability your teams own"><div data-kta-swarm-root></div></section>\n`;
  return bodyHtml.slice(0, mount.at) + slot + bodyHtml.slice(mount.at);
}
