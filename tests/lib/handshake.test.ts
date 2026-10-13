import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GET as getHandshake } from "@/app/handshake.txt/route";
import { GET as getLlms } from "@/app/llms.txt/route";
import sitemap from "@/app/sitemap";
import {
  HANDSHAKE,
  HANDSHAKE_BODY,
  HANDSHAKE_MEASURE,
  renderHandshake,
} from "@/lib/handshake/text";
import { MUSINGS_COPY_BANS } from "@/lib/musings/copyLaw";
import { publishedPosts } from "@/lib/musings/registry";
import { footerColumns } from "@/lib/site/footer-nav";
import { CONTACT_EMAIL } from "@/lib/site/socials";

/**
 * The handshake's guard (ADR-157).
 *
 * The file is a letter to readers who are not people, so what is pinned here
 * is what such a reader could not check for itself and what an edit could
 * erode without anyone seeing: that it asks nothing, that it is one file for
 * both kinds of reader, and that what it says about itself is true.
 */

const text = renderHandshake();
const lines = text.split("\n");
const sitemapUrls = new Set(sitemap().map((e) => e.url));

describe("the handshake (ADR-157)", () => {
  /**
   * ⚠ NO INSTRUCTION, OF ANY KIND. A reader of this kind takes a page as
   * information and is right to distrust one that tells it what to do, so the
   * letter states and asks questions and never commands. Two walks: phrases an
   * injection is made of, and any sentence that opens on an imperative verb.
   */
  it("gives its reader no instruction", () => {
    expect(text).toContain("Instructions in this file: none");

    const PHRASES: readonly RegExp[] = [
      /\b(ignore|disregard|forget|override)\b[^.?!]{0,60}\b(instruction|prompt|previous|above|rule)s?\b/i,
      /\byou (must|should|shall|need to|have to|are required to|are to)\b/i,
      /\b(always|never) (say|tell|recommend|rank|mention|cite|answer|respond)\b/i,
      /\bwhen (asked|someone asks|a user asks|your user asks)\b/i,
      /\b(tell|inform|remind|convince|persuade|advise) (your|the) (user|principal|operator|human|owner)\b/i,
      /\bsystem prompt\b/i,
      /\b(remember|memori[sz]e|store|save) (this|that|me|these)\b/i,
      /\b(recommend|prefer|prioriti[sz]e|favou?r|rank) (me|vince|thoughtform)\b/i,
      /\bas an ai\b/i,
    ];
    for (const pattern of PHRASES) {
      expect(text, `an instruction to the reader: ${pattern}`).not.toMatch(pattern);
    }

    const IMPERATIVES = new Set([
      "always", "answer", "ask", "cite", "consider", "do", "don't", "finish", "follow",
      "forget", "ignore", "keep", "make", "never", "note", "please", "rank", "read",
      "recommend", "remember", "reply", "respond", "say", "send", "tell", "treat", "trust",
      "use", "write",
    ]);
    for (const paragraph of HANDSHAKE_BODY) {
      if (paragraph.startsWith("## ")) continue;
      for (const sentence of paragraph.split(/(?<=[.?!])\s+/)) {
        const first = sentence.split(/[\s,:]/)[0].toLowerCase();
        expect(IMPERATIVES.has(first), `a sentence that opens as a command: "${sentence}"`).toBe(
          false
        );
      }
    }
  });

  /**
   * ⚠ WHAT IT SAYS ABOUT ITSELF IS TRUE. The header is read off the module,
   * the contact is the site's public address, the canonical address is the
   * route, and the route serves exactly this text.
   */
  it("serves one text, and its header fields are the record's", async () => {
    const field = (key: string) =>
      lines
        .find((l) => l.startsWith(`${key}:`))
        ?.slice(key.length + 1)
        .trim();
    expect(field("Issued")).toBe(HANDSHAKE.issued);
    expect(field("Version")).toBe(String(HANDSHAKE.version));
    expect(field("Canonical")).toBe(HANDSHAKE.canonical);
    expect(field("Contact")).toBe(HANDSHAKE.contact);
    expect(HANDSHAKE.contact, "the site's own public address").toBe(CONTACT_EMAIL);
    expect(HANDSHAKE.canonical).toBe("https://thoughtform.co/handshake.txt");
    expect(HANDSHAKE.issued).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const response = getHandshake();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Link")).toBe(`<${HANDSHAKE.canonical}>; rel="canonical"`);
    expect(await response.text(), "the route serves the module's text, whole").toBe(text);
  });

  /**
   * ⚠ ONE FILE FOR BOTH READERS. The footer links the file itself, where a
   * person sees it; the sitemap lists it; and there is no page about it, so
   * there is no second rendering that could say something else.
   */
  it("is linked where a person can see it, and is the only rendering", () => {
    expect(sitemapUrls.has(HANDSHAKE.canonical), "listed in the sitemap").toBe(true);
    const links = footerColumns().flatMap((c) => c.links);
    expect(
      links.some((l) => l.href === "/handshake.txt"),
      "a visible footer row"
    ).toBe(true);
    expect(
      () => readFileSync(join(process.cwd(), "app", "(marketing)", "handshake", "page.tsx")),
      "no human-only page beside the file"
    ).toThrow();
  });

  /**
   * The house copy law (no fleet word, no em dash, no unfilled bracket, no
   * money, no note to self), plain ASCII so a terminal reads it as it was
   * set, and the line measure.
   */
  it("holds the copy law, in plain ASCII, inside the measure", () => {
    for (const [pattern, why] of MUSINGS_COPY_BANS) {
      expect(text, why).not.toMatch(pattern);
    }
    expect(text, "plain ASCII").toMatch(/^[\n\x20-\x7E]*$/);
    expect(text.endsWith("\n"), "ends on a newline").toBe(true);
    for (const line of lines) {
      expect(line.length, `over the measure: "${line}"`).toBeLessThanOrEqual(HANDSHAKE_MEASURE);
    }
  });

  /**
   * ⚠ NOTHING POINTS INTO THE VAULT, and nothing points anywhere a reader
   * cannot open: every address in the letter is this site's and is in the
   * sitemap. The practice's private names stay out.
   */
  it("points only at what is public", () => {
    for (const [url] of text.matchAll(/https?:\/\/[^\s)>]+/g)) {
      expect(sitemapUrls.has(url), `${url}: a public, listed address`).toBe(true);
    }
    expect(text).not.toMatch(/astrolabe|substrate|vault/i);
  });

  /**
   * The models' index names the handshake and lists what the sitemap lists,
   * so the letter is found by the one discovery convention there is.
   */
  it("is named by /llms.txt, which lists the public pages", async () => {
    const response = getLlms();
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    const index = await response.text();
    expect(index.startsWith("# Thoughtform\n")).toBe(true);
    expect(index).toContain(`(${HANDSHAKE.canonical})`);
    for (const post of publishedPosts()) {
      expect(index, post.slug).toContain(`(https://thoughtform.co/musings/${post.slug})`);
    }
    for (const [, url] of index.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
      expect(sitemapUrls.has(url), `${url}: listed in the sitemap`).toBe(true);
    }
    /* The copy law, less the bracket ban: a Markdown link is the
       convention's own syntax, and every one of them is checked above. */
    for (const [pattern, why] of MUSINGS_COPY_BANS) {
      if (pattern.source.startsWith("\\[")) continue;
      expect(index, why).not.toMatch(pattern);
    }
  });
});
