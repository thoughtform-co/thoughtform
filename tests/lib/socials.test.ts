import { describe, expect, it } from "vitest";

import { CONTACT_EMAIL, SOCIALS, publishedSocials } from "@/lib/site/socials";

/**
 * The practice's public channels (ADR-105).
 *
 * ⚠ **THE POINT OF THIS FILE IS THAT `"#"` IS A FAILURE, NOT A VALUE.** Before
 * ADR-105 every social link on the site was `href="#"` — three in the old
 * `<footer class="foot">` and four on the About stage — and they had been for
 * as long as both lists existed. Two copies of the same four channels is how
 * one gets fixed and the other does not, so there is one record now and this
 * is what stops a placeholder shipping from it.
 */
describe("the site's social channels", () => {
  it("never carries a placeholder href", () => {
    for (const s of SOCIALS) {
      expect(s.href, `${s.label} is a placeholder`).not.toBe("#");
      expect(s.href, `${s.label} is a placeholder`).not.toBe("");
    }
  });

  it("is either unpublished or an absolute https URL — never a bare path", () => {
    for (const s of SOCIALS) {
      if (s.href === null) continue;
      expect(s.href, `${s.label} is not an absolute URL`).toMatch(/^https:\/\/[^\s]+$/);
    }
  });

  /**
   * ⚠ AN UNPUBLISHED CHANNEL IS ABSENT, NOT DEAD. `null` means "the channel is
   * decided, the URL has not landed" — the renderers map `publishedSocials()`
   * and draw nothing for it, so the page is correct while the record is
   * incomplete. Filling one in is a one-line change that lights it in BOTH
   * places at once.
   */
  it("hands the renderers only the channels that have somewhere to go", () => {
    const published = publishedSocials();
    expect(published.length).toBe(SOCIALS.filter((s) => s.href !== null).length);
    for (const s of published) expect(typeof s.href).toBe("string");
  });

  it("keeps the four channels the owner named, each once", () => {
    const icons = SOCIALS.map((s) => s.icon);
    expect(icons).toEqual(["linkedin", "x", "instagram", "youtube"]);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("answers on a real mailbox", () => {
    expect(CONTACT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/);
  });
});
