/**
 * The third cut's hero (ADR-143 U6): v1's prototype with its headline and
 * lede replaced by the intro record's, at parse time, on the server.
 *
 * Only the inner HTML of `h1.hero__headline` and `p.hero__desc` inside
 * `#hero` changes. The plate, the two buttons and the pronunciation line are
 * the prototype's, which v1, v2 and the AP lecture still read as they are.
 *
 * ⚠ IT THROWS ON A MISS, as `about.ts` does: a prototype edit that renamed
 * either class would otherwise leave the old hero on the page with every
 * guard green.
 *
 * Pure string surgery, no DOM: `workshop-intro.test.ts` runs it on the real
 * prototype.
 */

const HERO_SECTION = /<section\b[^>]*\bid="hero"[^>]*>[\s\S]*?<\/section>/i;
const HEADLINE = /(<h1\b[^>]*\bclass="[^"]*\bhero__headline\b[^"]*"[^>]*>)[\s\S]*?(<\/h1>)/i;
const DESC = /(<p\b[^>]*\bclass="[^"]*\bhero__desc\b[^"]*"[^>]*>)[\s\S]*?(<\/p>)/i;

export interface HeroCopy {
  headlineHtml: string;
  descHtml: string;
}

export function replaceHeroCopy(bodyHtml: string, copy: HeroCopy): string {
  const section = HERO_SECTION.exec(bodyHtml);
  if (!section) throw new Error("[workshop-v3 hero] no #hero section in the prototype");
  if (!HEADLINE.test(section[0])) {
    throw new Error("[workshop-v3 hero] no .hero__headline inside #hero");
  }
  if (!DESC.test(section[0])) throw new Error("[workshop-v3 hero] no .hero__desc inside #hero");

  const next = section[0]
    .replace(HEADLINE, (_m, open: string, close: string) => `${open}${copy.headlineHtml}${close}`)
    .replace(DESC, (_m, open: string, close: string) => `${open}${copy.descHtml}${close}`);
  return (
    bodyHtml.slice(0, section.index) + next + bodyHtml.slice(section.index + section[0].length)
  );
}
