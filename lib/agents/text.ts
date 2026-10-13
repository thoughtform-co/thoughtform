/**
 * lib/agents/text — the agents file, the ONE source (ADR-157).
 *
 * `/agents.txt` is the site's declaration for software agents: who runs the
 * site, what it offers an agent to call (nothing), which paths are closed,
 * and where the other machine-readable files are, the handshake among them.
 * `/.well-known/agents.txt` serves the same bytes and `/agent.txt` redirects.
 *
 * ⚠ THERE IS NO SETTLED STANDARD, SO IT IS VALID UNDER THE TWO THAT EXIST.
 * Read on 2026-10-13: an individual Internet-Draft
 * (draft-car-agents-txt-wellknown-00, a `Key: value` file that opens on
 * `# agents.txt` and `Spec-Version`, with `Site-Name` and `Site-URL` required)
 * and a community spec at agents-txt.com (directives that announce protocols,
 * every block optional). Both tell a parser to skip a key it does not know,
 * which is what lets one file satisfy both and carry four keys of its own.
 *
 * ⚠ IT DECLARES NO CAPABILITY, AND THAT IS A STATEMENT. The site is pages to
 * read. A `Capability:` block is a promise that an endpoint is there for an
 * agent to call on someone's behalf; adding one is a decision with an ADR.
 *
 * ⚠ THE ACCESS RULES ARE `app/robots.ts`, RESTATED, NEVER A SECOND POLICY.
 * Two files that disagree about a path leave an agent to guess which one the
 * owner meant. `tests/lib/handshake.test.ts` holds the two lists equal, and
 * holds every other field to the record it restates.
 *
 * ⚠ THE SAME NO AS THE HANDSHAKE. A field is a declaration and a `Disallow`
 * is a rule about this site. No line tells an agent what to do for whoever
 * sent it, and no line asks to be preferred, remembered or passed on.
 *
 * Zero imports, so the two routes and the test read one module.
 */

export const AGENTS_TXT = {
  specVersion: "1.0",
  canonical: "https://thoughtform.co/agents.txt",
  /** The Internet-Draft's address. Same bytes, and the header names the canonical. */
  wellKnown: "https://thoughtform.co/.well-known/agents.txt",
} as const;

const SITE = "https://thoughtform.co";

/** The site's own line, as `/llms.txt` has it. Restated: zero imports. */
const DESCRIPTION =
  "Vince Buyssens' practice in Antwerp. AI isn't software to command, but an intelligence to navigate; Thoughtform helps teams build that relationship.";

/** `lib/handshake/text.ts` `HANDSHAKE.contact`, restated. */
const CONTACT = "vince@thoughtform.co";

/** `app/robots.ts`, restated in its order. */
const DISALLOW: readonly string[] = ["/prototypes/", "/admin", "/orrery", "/astrogation", "/api/"];

/**
 * A field line, or a comment (a string that is not a pair). A comment is a
 * sentence in the third person: this file is not a letter, and the handshake
 * is.
 */
type Line = readonly [key: string, value: string] | string;

const LINES: readonly Line[] = [
  "agents.txt",
  ["Spec-Version", AGENTS_TXT.specVersion],
  "",
  "Thoughtform, thoughtform.co. What this site offers a software agent.",
  "",
  "This file declares no Capability. The site is pages to read, and nothing on",
  "it is offered to agents as a service to call.",
  "The Disallow lines are the ones in robots.txt, restated. Nothing else here",
  "is a rule, and nothing here is meant to change what an agent does for",
  "whoever sent it.",
  "",
  ["Site-Name", "Thoughtform"],
  ["Site-URL", SITE],
  ["Site-Description", DESCRIPTION],
  ["Site-Contact", CONTACT],
  "",
  "Where the other files are. These four keys belong to no agents.txt",
  "proposal, and a parser that does not know a key skips it.",
  ["Canonical", AGENTS_TXT.canonical],
  ["Sitemap", `${SITE}/sitemap.xml`],
  ["Llms-Txt", `${SITE}/llms.txt`],
  ["Handshake", `${SITE}/handshake.txt`],
  "",
  "The handshake is a letter from Vince to the non-human readers of this",
  "site. It carries no instructions.",
  "",
  ["Allow", "/"],
  ...DISALLOW.map((path) => ["Disallow", path] as const),
  "",
  ["Agent", "*"],
];

/**
 * The file, whole. A comment is set behind `# `, and an empty string is a
 * blank line when a field stands on either side of it and a bare `#` when it
 * falls inside a run of comments, so a comment block reads as one block.
 */
export function renderAgentsTxt(): string {
  const isComment = (line: Line | undefined) => typeof line === "string" && line !== "";
  return `${LINES.map((line, i) => {
    if (typeof line !== "string") return `${line[0]}: ${line[1]}`;
    if (line !== "") return `# ${line}`;
    return isComment(LINES[i - 1]) && isComment(LINES[i + 1]) ? "#" : "";
  }).join("\n")}\n`;
}

/** What both routes send with it. The draft recommends five minutes. */
export const AGENTS_TXT_HEADERS: Readonly<Record<string, string>> = {
  "Content-Type": "text/plain; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
  Link: `<${AGENTS_TXT.canonical}>; rel="canonical"`,
};
