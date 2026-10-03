/**
 * The third cut's About (ADR-143 U3): v1's prototype with its bio paragraphs
 * replaced by the intro record's, at parse time, on the server.
 *
 * Every `.voidwalker__bio` paragraph inside `#about` goes; the new ones take
 * the first one's place, with its attributes (the class and the `data-m`
 * reveal stamp), so the flow hook's `querySelectorAll` collects them at any
 * count. The name, the role line, the meta row and the portrait are
 * untouched.
 *
 * ⚠ IT THROWS ON A MISS. A prototype edit that renamed the class or the
 * section would otherwise leave the old About on the page with every guard
 * green; this way the build fails instead.
 *
 * Pure string surgery, no DOM: `workshop-intro.test.ts` runs it on the real
 * prototype.
 */

const ABOUT_SECTION = /<section\b[^>]*\bid="about"[^>]*>[\s\S]*?<\/section>/i;
const BIO_PARAGRAPH = /<p\b([^>]*\bclass="[^"]*\bvoidwalker__bio\b[^"]*"[^>]*)>[\s\S]*?<\/p>\s*/gi;

export function replaceAboutBio(bodyHtml: string, paragraphs: readonly string[]): string {
  const section = ABOUT_SECTION.exec(bodyHtml);
  if (!section) throw new Error("[workshop-v3 about] no #about section in the prototype");
  if (paragraphs.length === 0) throw new Error("[workshop-v3 about] no paragraphs to write");

  let attrs: string | null = null;
  const stripped = section[0].replace(BIO_PARAGRAPH, (match, a: string) => {
    if (attrs !== null) return "";
    attrs = a;
    return "\u0000";
  });
  if (attrs === null) {
    throw new Error("[workshop-v3 about] no .voidwalker__bio paragraphs inside #about");
  }
  const open = `<p${attrs as string}>`;
  const written = paragraphs.map((p) => `${open}${p}</p>`).join("\n        ") + "\n        ";
  const next = stripped.replace("\u0000", written);
  return (
    bodyHtml.slice(0, section.index) + next + bodyHtml.slice(section.index + section[0].length)
  );
}
