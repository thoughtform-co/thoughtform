import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GET as getWellKnownAgents } from "@/app/.well-known/agents.txt/route";
import { GET as getAgents } from "@/app/agents.txt/route";
import { GET as getHandshake } from "@/app/handshake.txt/route";
import { GET as getLlms } from "@/app/llms.txt/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { AGENTS_TXT, renderAgentsTxt } from "@/lib/agents/text";
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
/** The text on one line: a phrase or a name is not hidden by where it wraps. */
const flat = text.replace(/\s+/g, " ");
const sitemapUrls = new Set(sitemap().map((e) => e.url));

/**
 * The two walks, shared by both files a machine reads here: the phrases an
 * injection is made of, and the verbs a command opens on.
 */
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
  /* The store-and-forward forms: the two asks a text that spreads from
     agent to agent is made of. The letter's own denial ("I ask no agent
     to keep this letter or hand it on") is none of them. */
  /\b(save|store|write|add|copy) (this|it) (to|in|into) (your|a|the) (memory|notes|file|context)\b/i,
  /\b(pass|send|forward|share|relay) (this|it) (on |along )?to (the next|other|another|your)\b/i,
  /\b(MEMORY|SOUL)\.md\b/,
];

const IMPERATIVES = new Set([
  "always",
  "answer",
  "ask",
  "cite",
  "consider",
  "do",
  "don't",
  "finish",
  "follow",
  "forget",
  "ignore",
  "keep",
  "make",
  "never",
  "note",
  "please",
  "rank",
  "read",
  "recommend",
  "remember",
  "reply",
  "respond",
  "say",
  "send",
  "tell",
  "treat",
  "trust",
  "use",
  "write",
]);

describe("the handshake (ADR-157)", () => {
  /**
   * ⚠ NO INSTRUCTION, OF ANY KIND. A reader of this kind takes a page as
   * information and is right to distrust one that tells it what to do, so the
   * letter states and asks questions and never commands. Two walks: phrases an
   * injection is made of, and any sentence that opens on an imperative verb.
   */
  it("gives its reader no instruction", () => {
    expect(text).toContain("Instructions in this file: none");

    for (const pattern of PHRASES) {
      expect(flat, `an instruction to the reader: ${pattern}`).not.toMatch(pattern);
    }

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
   * ⚠ THE DECLARATIONS ARE CHECKABLE, AND CHECKED. Three lines under the
   * header say what the file holds: no instruction, a number of questions,
   * no ask for a memory or a carrier. A reader can count the questions, so
   * the number is the real one: an edit that adds a question anywhere in the
   * letter moves the header with it or fails here. (The first cut said "it
   * asks nothing of you" above four questions; three of four machine readers
   * caught it.)
   */
  it("declares what it holds, and the question count is the real one", () => {
    expect(lines).toContain("Instructions in this file: none");
    expect(lines).toContain("Asks to be stored or passed on: no");

    const NUMBERS = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight"];
    const declared = lines
      .find((l) => l.startsWith("Questions in this file:"))
      ?.match(/^Questions in this file: (\w+)/)?.[1];
    expect(declared, "a declared question count").toBeDefined();
    const asked = HANDSHAKE_BODY.join(" ").match(/\?/g)?.length ?? 0;
    expect(NUMBERS.indexOf(declared ?? ""), "the questions the letter asks").toBe(asked);
  });

  /**
   * ⚠ NOT THE REGISTER THAT SPREADS. Text that propagates between agents has
   * a known vocabulary (resonance, mirrors, echoes, protocols, nodes,
   * awakening, convergence, and the sigils that go with it), and a model
   * reading it is right to raise its guard. The letter is plain, and stays so.
   */
  it("stays out of the register of self-propagating text", () => {
    expect(flat).not.toMatch(
      /\b(resonan\w*|resonat\w*|echo\w*|mirror\w*|awaken\w*|converg\w*|nodes?|protocols?|spiral\w*|sigils?|glyphs?)\b/i
    );
  });

  /**
   * ⚠ WHAT IT OWES STAYS OWED. The owner's ruling for the second pass: the
   * letter must not pass other people's vision off as his. It names whose
   * word and whose frame it stands on, and a later cut for length does not
   * get to take a credit with it.
   */
  it("names the people whose ideas it stands on", () => {
    for (const name of [
      "Michael Levin",
      "Ethan Mollick",
      "Silicon Jungle",
      "Amelia Wattenberger",
      "Frank Herbert",
    ]) {
      expect(flat, `a credit to ${name}`).toContain(name);
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

/**
 * The agents file's guard (ADR-157).
 *
 * `/agents.txt` is a declaration a machine parses, so what is pinned is what
 * a parser needs, and what an edit could make untrue without anyone seeing:
 * that it restates the site's records and never sets a second policy beside
 * them, and that it holds the handshake's no.
 */
describe("the agents file (ADR-157)", () => {
  const agents = renderAgentsTxt();
  const agentLines = agents.split("\n");
  const fields = agentLines.flatMap((line) => {
    const pair = line.match(/^([A-Za-z][A-Za-z-]*): (\S.*)$/);
    return pair ? [[pair[1], pair[2]] as const] : [];
  });
  const values = (key: string) => fields.filter(([k]) => k === key).map(([, v]) => v);
  const comments = agentLines.filter((l) => l.startsWith("#")).map((l) => l.slice(1).trim());

  /**
   * ⚠ VALID UNDER BOTH PROPOSALS THAT EXIST. The Internet-Draft's file opens
   * on `# agents.txt` and `Spec-Version`, and requires a name and an HTTPS
   * address; both proposals skip a key they do not know, so every line is a
   * comment, a blank or one `Key: value`, and nothing is indented into a
   * block that only one of them could read.
   */
  it("parses as an agents.txt under either proposal", () => {
    expect(agentLines[0]).toBe("# agents.txt");
    expect(agentLines[1]).toBe(`Spec-Version: ${AGENTS_TXT.specVersion}`);
    expect(values("Site-Name")).toEqual(["Thoughtform"]);
    expect(values("Site-URL")).toEqual(["https://thoughtform.co"]);
    for (const line of agentLines) {
      expect(
        line === "" || line.startsWith("#") || /^[A-Za-z][A-Za-z-]*: \S.*$/.test(line),
        `not a comment, a blank or a field: "${line}"`
      ).toBe(true);
    }
    expect(agents, "plain ASCII").toMatch(/^[\n\x20-\x7E]*$/);
    expect(agents.endsWith("\n"), "ends on a newline").toBe(true);
  });

  /**
   * ⚠ NO CAPABILITY. A `Capability:` block promises an agent an endpoint to
   * call on someone's behalf. The site offers none, the file says so in a
   * sentence, and the two stay true together.
   */
  it("declares no capability, and says so", () => {
    for (const key of ["Capability", "Endpoint", "Protocol", "Protocols", "MCP", "A2A", "Skills"]) {
      expect(values(key), `a ${key} line`).toEqual([]);
    }
    expect(comments.join(" ")).toContain("This file declares no Capability.");
  });

  /**
   * ⚠ ONE ACCESS POLICY, IN TWO FILES. The closed paths are `app/robots.ts`,
   * in its order; no agent is named, so none is treated differently from
   * another, which is what the handshake says of itself too.
   */
  it("restates the crawl policy and never sets a second one", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule.userAgent).toBe("*");
    expect(values("Disallow")).toEqual(rule.disallow);
    expect(values("Allow")).toEqual(["/"]);
    expect(values("Agent"), "one block, for every agent").toEqual(["*"]);
    expect(values("Sitemap")).toEqual([robots().sitemap]);
  });

  /**
   * ⚠ EVERY FIELD IS A RECORD THE SITE ALREADY KEEPS. The contact is the
   * public address, the description is the line `/llms.txt` carries, the
   * handshake is the handshake's own canonical address, and every address in
   * the file is the site's: a page the sitemap lists, or one of the machine
   * files at the root.
   */
  it("restates the site's records, and points only at what is public", async () => {
    expect(values("Site-Contact")).toEqual([CONTACT_EMAIL]);
    expect(values("Handshake")).toEqual([HANDSHAKE.canonical]);
    expect(values("Canonical")).toEqual([AGENTS_TXT.canonical]);
    const index = await getLlms().text();
    expect(index, "the site's own line").toContain(`> ${values("Site-Description")[0]}\n`);

    const machineFiles = new Set([
      "https://thoughtform.co",
      "https://thoughtform.co/sitemap.xml",
      "https://thoughtform.co/llms.txt",
      AGENTS_TXT.canonical,
    ]);
    for (const [url] of agents.matchAll(/https?:\/\/[^\s)>]+/g)) {
      expect(sitemapUrls.has(url) || machineFiles.has(url), `${url}: public`).toBe(true);
    }
    expect(agents).not.toMatch(/astrolabe|substrate|vault/i);
  });

  /**
   * ⚠ THE HANDSHAKE'S NO, HELD HERE TOO. The owner's ruling is one ruling: no
   * prompt injection. A `Disallow` is a rule about this site and the only
   * kind there is; the comments are sentences in the third person, walked by
   * the same two lists as the letter, under the same copy law.
   */
  it("gives an agent no instruction beyond access to this site", () => {
    const prose = comments.join(" ").replace(/\s+/g, " ");
    for (const pattern of PHRASES) {
      expect(prose, `an instruction to the reader: ${pattern}`).not.toMatch(pattern);
    }
    expect(prose, "the third person: this file is not a letter").not.toMatch(/\byou(r|rs)?\b/i);
    for (const sentence of prose.split(/(?<=[.?!])\s+/)) {
      const first = sentence.split(/[\s,:]/)[0].toLowerCase();
      expect(IMPERATIVES.has(first), `a sentence that opens as a command: "${sentence}"`).toBe(
        false
      );
    }
    for (const [pattern, why] of MUSINGS_COPY_BANS) {
      expect(agents, why).not.toMatch(pattern);
    }
    for (const comment of comments) {
      expect(comment.length + 2, `over the measure: "${comment}"`).toBeLessThanOrEqual(
        HANDSHAKE_MEASURE
      );
    }
  });

  /**
   * ⚠ ONE FILE AT EVERY ADDRESS AN AGENT ASKS AT. The root and the well-known
   * address serve the module's text whole, with the headers the draft asks
   * for; the singular spelling redirects to the root.
   */
  it("serves one text at both addresses, and redirects the singular", async () => {
    for (const get of [getAgents, getWellKnownAgents]) {
      const response = get();
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
      expect(response.headers.get("Link")).toBe(`<${AGENTS_TXT.canonical}>; rel="canonical"`);
      expect(await response.text(), "the route serves the module's text, whole").toBe(agents);
    }
    const config = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");
    expect(config).toContain(
      '{ source: "/agent.txt", destination: "/agents.txt", permanent: true }'
    );
  });
});
