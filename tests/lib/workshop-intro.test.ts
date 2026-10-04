import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { replaceAboutBio } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/about";
import { replaceHeroCopy } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/hero";
import { workshopV3Tracks } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/WorkshopProof";
import { proofStackTracks } from "@/components/landing/home-v2/services/proof-stack/proofOrder";
import { heroMeasureFaults } from "@/lib/arcs/copyLaw";
import { HAND_IT_TO_AN_AGENT } from "@/lib/arcs/content/shared/handItToAnAgent";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import { THOUGHTFORM_WORKSHOP_V3_ARC } from "@/lib/arcs/content/thoughtform-workshop-v3";
import { getThoughtformWorkshopContent } from "@/lib/v7-parse";

/**
 * The workshop's intro record and its seams (ADR-143 U3, U6). The record is
 * copy for a room, so the copy law is pinned here; the seams are each the
 * identity elsewhere, which `corridor-copy.test.ts` pins for the corridor.
 */

/** The voice skill's hard bans that could plausibly reach this copy. */
const BANNED = [
  "leverage",
  "unlock",
  "harness",
  "delve",
  "empower",
  "seamless",
  "game-changer",
  "transformative",
  "elevate",
  "robust",
  "load-bearing",
  "gated on",
];

function strings(): { at: string; text: string }[] {
  const out: { at: string; text: string }[] = [];
  for (const [k, t] of Object.entries(WORKSHOP_INTRO.hero)) out.push({ at: `hero.${k}`, text: t });
  WORKSHOP_INTRO.about.forEach((t, i) => out.push({ at: `about[${i}]`, text: t }));
  for (const [k, t] of Object.entries(WORKSHOP_INTRO.thesis))
    out.push({ at: `thesis.${k}`, text: t });
  for (const [k, t] of Object.entries(WORKSHOP_INTRO.phases))
    out.push({ at: `phases.${k}`, text: t ?? "" });
  for (const [k, t] of Object.entries(WORKSHOP_INTRO.stations))
    out.push({ at: `stations.${k}`, text: t ?? "" });
  out.push({ at: "stack.surfacesTitle", text: WORKSHOP_INTRO.stack.surfacesTitle });
  out.push({ at: "stack.surfacesSub", text: WORKSHOP_INTRO.stack.surfacesSub });
  WORKSHOP_INTRO.stack.surfaceLabels.forEach((t, i) =>
    out.push({ at: `stack.surfaceLabels[${i}]`, text: t })
  );
  for (const [k, t] of Object.entries(WORKSHOP_INTRO.signal))
    if (typeof t === "string") out.push({ at: `signal.${k}`, text: t });
  for (const [k, t] of Object.entries(WORKSHOP_INTRO.proof.ledes))
    out.push({ at: `proof.${k}`, text: t });
  for (const [name, t] of [
    ["opening", WORKSHOP_INTRO.opening.head.title],
    ["curve", WORKSHOP_INTRO.curve.head.title],
    ["steer", WORKSHOP_INTRO.steer.head.title],
  ] as const) {
    out.push({ at: `${name}.title`, text: `${t.pre} ${t.em}` });
  }
  return out;
}

const plain = (html: string) => html.replace(/<[^>]+>/g, "");

describe("the workshop intro record (ADR-143 U3)", () => {
  it("keeps the copy law: no em dash, no banned word, no stray digit", () => {
    for (const { at, text } of strings()) {
      expect(text, `${at}: an em dash`).not.toContain("—");
      for (const word of BANNED) {
        expect(plain(text).toLowerCase(), `${at}: "${word}"`).not.toContain(word);
      }
      const digits = plain(text).replace("30-second", "");
      expect(digits, `${at}: a digit`).not.toMatch(/\d/);
    }
  });

  it("says each card in one line, inside the cases bound", () => {
    for (const [id, lede] of Object.entries(WORKSHOP_INTRO.proof.ledes)) {
      expect(lede.length, id).toBeLessThanOrEqual(180);
      expect(lede.trim(), id).toBe(lede);
    }
  });

  it("gives every caption exactly one break, and the signal line its own title", () => {
    for (const [id, caption] of Object.entries(WORKSHOP_INTRO.stations)) {
      expect(caption?.match(/<br>/g)?.length, id).toBe(1);
    }
    // Owner, 2026-10-04 (ADR-143 U6): the practice, not the homepage's offer.
    // The button stays the homepage's, so the record carries no `cta`.
    const { titleHtml, ariaLabel, ...rest } = WORKSHOP_INTRO.signal;
    expect(rest).toEqual({ ticker: false });
    expect(titleHtml?.match(/<br>/g)?.length, "one break").toBe(1);
    expect(titleHtml?.match(/<em>/g)?.length, "one accent").toBe(1);
    // ADR-143 U7: the stations' grammar, the verb in gold and its object, so
    // the line reads as the Arc's last move.
    expect(titleHtml, "the accent is the verb that opens the line").toMatch(
      /^<em>[A-Z]+<\/em> [^<]+<br>[^<]+$/
    );
    expect(ariaLabel?.toUpperCase(), "the phone label says the title").toBe(
      plain(titleHtml!.replace("<br>", " ")).replace(/\.$/, "")
    );
  });

  it("keeps the hero inside the house measure", () => {
    const title = plain(WORKSHOP_INTRO.hero.headlineHtml.replace(/<br\s*\/?>/g, " "));
    expect(heroMeasureFaults(title, WORKSHOP_INTRO.hero.descHtml)).toEqual([]);
  });

  it("gives the Build column one agent per piece of work, none lit", () => {
    // ShellStack draws five surface tips; a sixth label would have no anchor.
    expect(WORKSHOP_INTRO.stack.surfaceLabels).toHaveLength(5);
    expect(new Set(WORKSHOP_INTRO.stack.surfaceLabels).size).toBe(5);
    expect(WORKSHOP_INTRO.stack.surfaceLit).toBeNull();
  });

  it("changes only the opening's title and drops its sub, and v3 opens on it", () => {
    const { head, ...rest } = WORKSHOP_INTRO.opening;
    const { head: sharedHead, ...sharedRest } = HAND_IT_TO_AN_AGENT;
    expect(rest).toEqual(sharedRest);
    expect({ ...head, title: undefined, sub: undefined }).toEqual({
      ...sharedHead,
      title: undefined,
      sub: undefined,
    });
    expect(head.title).not.toEqual(sharedHead.title);
    expect(head.sub, "the title alone opens the day").toBeUndefined();
    expect(THOUGHTFORM_WORKSHOP_V3_ARC.sections[0]).toBe(WORKSHOP_INTRO.opening);
  });
});

describe("the About rewrite", () => {
  const { bodyHtml } = getThoughtformWorkshopContent();
  const about = (html: string) => /<section\b[^>]*\bid="about"[\s\S]*?<\/section>/.exec(html)![0];
  const bios = (html: string) => about(html).match(/class="voidwalker__bio"/g)?.length ?? 0;

  it("writes the record's paragraphs over the prototype's, the role unchanged", () => {
    expect(bios(bodyHtml), "the prototype's three").toBe(3);
    const next = replaceAboutBio(bodyHtml, WORKSHOP_INTRO.about);
    expect(bios(next)).toBe(WORKSHOP_INTRO.about.length);
    for (const p of WORKSHOP_INTRO.about) expect(about(next)).toContain(p);
    expect(about(next)).not.toContain("tides of digital");
    const role = (html: string) => /voidwalker__role[^>]*>([^<]*)</.exec(about(html))![1];
    expect(role(next)).toBe(role(bodyHtml));
    expect(next.replace(about(next), "")).toBe(bodyHtml.replace(about(bodyHtml), ""));
  });

  it("throws rather than leave the old About on a miss", () => {
    expect(() => replaceAboutBio("<main></main>", WORKSHOP_INTRO.about)).toThrow(/#about/);
    expect(() =>
      replaceAboutBio('<section id="about"><p>x</p></section>', WORKSHOP_INTRO.about)
    ).toThrow(/voidwalker__bio/);
  });
});

describe("the hero rewrite", () => {
  const { bodyHtml } = getThoughtformWorkshopContent();
  const hero = (html: string) => /<section\b[^>]*\bid="hero"[\s\S]*?<\/section>/.exec(html)![0];

  it("writes the record's headline and lede, and nothing else", () => {
    expect(hero(bodyHtml)).toContain("AI capability,<br />built inside the work.");
    const next = replaceHeroCopy(bodyHtml, WORKSHOP_INTRO.hero);
    expect(hero(next)).toContain(
      `<h1 class="hero__headline">${WORKSHOP_INTRO.hero.headlineHtml}</h1>`
    );
    expect(hero(next)).toContain(`<p class="hero__desc">${WORKSHOP_INTRO.hero.descHtml}</p>`);
    expect(hero(next)).not.toContain("built inside the work");
    // The buttons are the prototype's, and so is everything outside the hero.
    expect(hero(next)).toContain("Begin navigation");
    expect(hero(next)).toContain("See the proof");
    expect(next.replace(hero(next), "")).toBe(bodyHtml.replace(hero(bodyHtml), ""));
  });

  it("throws rather than leave the old hero on a miss", () => {
    expect(() => replaceHeroCopy("<main></main>", WORKSHOP_INTRO.hero)).toThrow(/#hero/);
    expect(() =>
      replaceHeroCopy(
        '<section id="hero"><p class="hero__desc">x</p></section>',
        WORKSHOP_INTRO.hero
      )
    ).toThrow(/hero__headline/);
    expect(() =>
      replaceHeroCopy(
        '<section id="hero"><h1 class="hero__headline">x</h1></section>',
        WORKSHOP_INTRO.hero
      )
    ).toThrow(/hero__desc/);
  });
});

describe("the third cut's proof pile", () => {
  it("replaces each card's lede and empties its phase, nothing else", () => {
    const record = proofStackTracks();
    const v3 = workshopV3Tracks();
    expect(v3.map((t) => t.id)).toEqual(record.map((t) => t.id));
    v3.forEach((track, i) => {
      const { card, stamp, ...rest } = track;
      const { card: recordCard, stamp: recordStamp, ...recordRest } = record[i];
      expect(rest).toEqual(recordRest);
      expect(recordCard, track.id).toBeDefined();
      expect({ ...card, lede: undefined }).toEqual({ ...recordCard, lede: undefined });
      expect(card?.lede).toBe(
        WORKSHOP_INTRO.proof.ledes[track.id as keyof typeof WORKSHOP_INTRO.proof.ledes]
      );
      // The head letters the client alone (owner, 2026-10-04): the proof is
      // how the Arc was applied, not one phase of it.
      expect(recordStamp?.phase, track.id).toBeTruthy();
      expect(stamp).toEqual({ ...recordStamp, phase: "" });
    });
  });

  it("lights the record's card in the route sheet, scoped to v3", () => {
    const sheet = readFileSync(
      join(process.cwd(), "app/(marketing)/arcs/thoughtform/workshop-v1/thoughtform-workshop.css"),
      "utf8"
    );
    const selector = `.pf-card[aria-labelledby="pf-card-${WORKSHOP_INTRO.proof.lit}"]`;
    expect(sheet).toContain(selector);
    const page = readFileSync(
      join(process.cwd(), "app/(marketing)/arcs/thoughtform/workshop-v3/page.tsx"),
      "utf8"
    );
    expect(page).toContain('data-tw-cut="v3"');
  });
});
