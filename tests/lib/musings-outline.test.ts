import { describe, expect, it } from "vitest";

import { outlineOf } from "@/lib/musings/outline";
import { allPosts } from "@/lib/musings/registry";

/**
 * The essay's shape (`lib/musings/outline.ts`) — the record a drawing of a
 * post may plot: its sections and their lengths, split the way the page
 * renders them.
 */

describe("outlineOf — the split follows what the page renders", () => {
  it("opens on an unheaded lead, then one section per `##`", () => {
    const o = outlineOf("One two three.\n\n## First part\n\nFour five.\n\n## Second\n\nSix.");
    expect(o.sections).toEqual([
      { heading: null, words: 3 },
      { heading: "First part", words: 2 },
      { heading: "Second", words: 1 },
    ]);
    expect(o.words).toBe(6);
  });

  it("drops an EMPTY lead — a post that opens on its heading has nothing before it", () => {
    const o = outlineOf("## Straight in\n\nWords here.");
    expect(o.sections).toEqual([{ heading: "Straight in", words: 2 }]);
  });

  it("splits on `#` too (mdx.tsx renders it as the section heading) but never on `###`", () => {
    const o = outlineOf("Lead.\n\n# Top\n\nA b.\n\n### Sub head\n\nC d e.");
    expect(o.sections.map((s) => s.heading)).toEqual([null, "Top"]);
    // The sub-heading's words are prose inside its section; its marks are not.
    expect(o.sections[1].words).toBe(2 + 2 + 3);
  });

  it("normalises CRLF, so a heading never carries a `\\r`", () => {
    const o = outlineOf("Lead words.\r\n\r\n## Windows heading\r\n\r\nBody text here.\r\n");
    expect(o.sections[1]).toEqual({ heading: "Windows heading", words: 3 });
  });

  it("strips a heading's inline marks and its closing hashes", () => {
    const o = outlineOf("## **Bold** and `code` and [a link](https://x.y) ##\n\nText.");
    expect(o.sections[0].heading).toBe("Bold and code and a link");
  });

  it("counts no words inside fenced code — including a `##` that is code", () => {
    const o = outlineOf("Lead.\n\n```md\n## not a heading\nlots of code words\n```\n\nAfter.");
    expect(o.sections).toEqual([{ heading: null, words: 2 }]);
  });

  it("counts no words inside a `<Figure>`, on one line or several", () => {
    const one = outlineOf(
      'Lead.\n\n<Figure src="/a.webp" caption="Many caption words here" />\n\nEnd.'
    );
    expect(one.words).toBe(2);
    const many = outlineOf(
      'Lead.\n\n<Figure\n  src="/a.webp"\n  caption="Many caption words here"\n/>\n\nEnd.'
    );
    expect(many.words).toBe(2);
  });

  it("the sections always sum to the total", () => {
    const o = outlineOf("A b c.\n\n## One\n\nD e.\n\n## Two\n\nF g h i.");
    expect(o.sections.reduce((n, s) => n + s.words, 0)).toBe(o.words);
  });
});

describe("outlineOf — every real post", () => {
  const posts = allPosts();

  it("reads at least one headed section from every post on disk", () => {
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      const o = outlineOf(p.body);
      expect(
        o.sections.some((s) => s.heading),
        p.slug
      ).toBe(true);
      for (const s of o.sections) if (s.heading) expect(s.heading, p.slug).not.toMatch(/[#*`\r]/);
    }
  });

  it("agrees with the registry's reading time to within a minute", () => {
    // The registry counts the whole body (headings included) at 220 words a
    // minute; the outline counts prose only. They may differ by a heading's
    // words, never by a minute.
    for (const p of posts) {
      const minutes = Math.max(1, Math.round(outlineOf(p.body).words / 220));
      expect(Math.abs(minutes - p.readingMinutes), p.slug).toBeLessThanOrEqual(1);
    }
  });
});
