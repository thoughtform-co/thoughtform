import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { replaceAboutBio } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/about";
import { workshopV3Tracks } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/WorkshopProof";
import { proofStackTracks } from "@/components/landing/home-v2/services/proof-stack/proofOrder";
import { HAND_IT_TO_AN_AGENT } from "@/lib/arcs/content/shared/handItToAnAgent";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import { THOUGHTFORM_WORKSHOP_V3_ARC } from "@/lib/arcs/content/thoughtform-workshop-v3";
import { getThoughtformWorkshopContent } from "@/lib/v7-parse";

/**
 * The workshop's intro record and its seams (ADR-143 U3). The record is
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
  WORKSHOP_INTRO.about.forEach((t, i) => out.push({ at: `about[${i}]`, text: t }));
  for (const [k, t] of Object.entries(WORKSHOP_INTRO.stations))
    out.push({ at: `stations.${k}`, text: t ?? "" });
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

  it("gives every caption exactly one break, and keeps the homepage's signal line", () => {
    for (const [id, caption] of Object.entries(WORKSHOP_INTRO.stations)) {
      expect(caption?.match(/<br>/g)?.length, id).toBe(1);
    }
    // Owner, 2026-10-03: the title and the button are the homepage's.
    expect(WORKSHOP_INTRO.signal).toEqual({ ticker: false });
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

describe("the third cut's proof pile", () => {
  it("replaces only each card's lede", () => {
    const record = proofStackTracks();
    const v3 = workshopV3Tracks();
    expect(v3.map((t) => t.id)).toEqual(record.map((t) => t.id));
    v3.forEach((track, i) => {
      const { card, ...rest } = track;
      const { card: recordCard, ...recordRest } = record[i];
      expect(rest).toEqual(recordRest);
      expect(recordCard, track.id).toBeDefined();
      expect(card?.lede).toBe(
        WORKSHOP_INTRO.proof.ledes[track.id as keyof typeof WORKSHOP_INTRO.proof.ledes]
      );
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
