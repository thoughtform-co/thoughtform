import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { UX_MEETUP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/ux-meetup/journey";
import { WORKSHOP_V3_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/journey";
import { workshopV3Tracks } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/WorkshopProof";
import { AP_HOGESCHOOL_ARC } from "@/lib/arcs/content/ap-hogeschool";
import { ITP_WALL_CAPTION, ITP_WALL_MEDIA } from "@/lib/arcs/content/shared/in-the-pocket";
import { THREE_WAYS_LOOP } from "@/lib/arcs/content/shared/threeWaysLoop";
import {
  TOM_BENCH_EXAMPLE,
  TOM_PATH_STAGES,
  TOM_WALL_CAPTION,
  TOM_WALL_MEDIA,
} from "@/lib/arcs/content/shared/tom-on-the-moon";
import { HARD_TO_STEER_BEAT, THE_CURVE_BEAT } from "@/lib/arcs/content/shared/workshopFraming";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import {
  UX_MEETUP_ARC,
  UX_MEETUP_HERO,
  UX_MEETUP_PROOF_LEDES,
} from "@/lib/arcs/content/ux-meetup";
import { heroMeasureFaults, PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";

/**
 * The UX meetup talk's route guard (ADR-156).
 *
 * ⚠ THE SHAPE IS THE LECTURE'S OWN TEST (`ap-hogeschool.test.ts`), and for
 * its reason: this route reads the SAME prototype through the SAME function
 * with the SAME removed stations, so the parse test already guards the markup,
 * and the folder walk in `thoughtform-workshop-v2.test.ts` covers this
 * folder's `OWN_ROUTE_SLUGS` row. What is pinned here is only what is TRUE OF
 * THIS ROUTE: that it is v3's page with the record swapped, that its hero and
 * one proof lede are its own, and that its evidence is the shared records.
 */

const ARCS_DIR = join(__dirname, "..", "..", "app", "(marketing)", "arcs");
const routeFile = (...p: string[]) => readFileSync(join(ARCS_DIR, ...p), "utf8");

const REMOVED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  "continuum",
  "practice",
  "buildQuote",
  "build",
] as const;

describe("the UX meetup talk (ADR-156)", () => {
  /**
   * ⚠ IT IS v3's PAGE WITH THE RECORD SWAPPED, as Suri's lunch and learn is
   * (ADR-147): v1's prototype, sheet and root class, v3's cut stamp, v3's
   * seams and leaves by import. The day the corridor half diverges, all of it
   * forks together (ADR-139).
   */
  it("shares the corridor with v3 rather than forking it", () => {
    const page = routeFile("thoughtform", "ux-meetup", "page.tsx");
    expect(page, "renders v1's root class on v3's cut").toContain(
      'className="tw-root" data-tw-cut="v3"'
    );
    expect(page, "imports v1's route sheet").toContain(
      '"../workshop-v1/thoughtform-workshop.css"'
    );
    expect(page, "imports v3's opener sheet").toContain('"../workshop-v3/equilibrium.css"');
    expect(page, "loads the sheet the path kind is styled in").toContain(
      '"@/components/arcs/course.css"'
    );
    expect(page, "reads v1's prototype").toContain("getThoughtformWorkshopContent");
    for (const station of REMOVED_STATIONS) {
      expect(page, `removes ${station}, as v1 does`).toContain(`"${station}"`);
    }
    for (const seam of ["../workshop-v3/about", "../workshop-v3/equilibrium", "../workshop-v3/hero"]) {
      expect(page, `v3's seam by import: ${seam}`).toContain(`"${seam}"`);
    }
    const portals = routeFile("thoughtform", "ux-meetup", "WorkshopPortals.tsx");
    expect(portals, "reuses v3's proof, never a copy").toContain('"../workshop-v3/WorkshopProof"');
    expect(portals, "reuses v3's opener mount").toContain('"../workshop-v3/EquilibriumMount"');
    expect(portals, "reuses v1's About flow").toContain('"../workshop-v1/flow/useWorkshopFlow"');
    /* The two orders are equal TODAY; the files are separate so they need
       not stay equal. A deliberately weak pin. */
    expect([...UX_MEETUP_JOURNEY_ORDER]).toEqual([...WORKSHOP_V3_JOURNEY_ORDER]);
  });

  /**
   * The hero is the talk's own, written over the prototype's, and it is one
   * record with the arc's: what the room reads and what the overview's card
   * says cannot drift apart.
   */
  it("says one hero, inside the house measure", () => {
    const { title, lede } = UX_MEETUP_ARC.hero;
    const titleText = [title.pre, title.em, title.post].filter(Boolean).join(" ");
    expect(heroMeasureFaults(titleText, lede)).toEqual([]);
    const headline = UX_MEETUP_HERO.headlineHtml.replace(/<br\s*\/?>/g, " ");
    expect(headline, "the headline is the arc's title").toBe(titleText);
    expect(UX_MEETUP_HERO.descHtml, "the lede is the arc's lede").toBe(lede);
  });

  /**
   * ⚠ ONE LEDE DIFFERS FROM v3's, AND ONLY ONE. v3's last proof card ends on
   * "The rest of today is how", a promise a talk does not keep. The seam is
   * the identity when nothing is passed, so v3 and Suri's cut are unchanged.
   */
  it("reads v3's proof with the workshop's promise taken out", () => {
    const record = WORKSHOP_INTRO.proof.ledes;
    for (const id of WORKSHOP_INTRO.proof.order) {
      if (id === "ai-transformation") continue;
      expect(UX_MEETUP_PROOF_LEDES[id], `${id}: v3's lede, by value`).toBe(record[id]);
    }
    expect(record["ai-transformation"]).toContain("The rest of today is how");
    expect(UX_MEETUP_PROOF_LEDES["ai-transformation"]).not.toMatch(/today/i);
    expect(record["ai-transformation"].startsWith(UX_MEETUP_PROOF_LEDES["ai-transformation"])).toBe(
      true
    );

    const talk = workshopV3Tracks(UX_MEETUP_PROOF_LEDES);
    const v3 = workshopV3Tracks();
    expect(talk.map((t) => t.id)).toEqual(v3.map((t) => t.id));
    for (const [i, track] of talk.entries()) {
      expect(track.card?.lede).toBe(UX_MEETUP_PROOF_LEDES[track.id as keyof typeof record]);
      expect(v3[i].card?.lede, "the default is the record's").toBe(
        record[track.id as keyof typeof record]
      );
    }
  });

  /**
   * ⚠ NO SWITCH, as on the lecture: this page carries no switched beats, so
   * the island is not mounted and no section carries a panel stamp.
   */
  it("carries no worked-example switch", () => {
    const tail = routeFile("thoughtform", "ux-meetup", "WorkshopTail.tsx");
    expect(tail, "the tail mounts no switch").not.toContain("ArcWorkedSwitch");
    for (const s of UX_MEETUP_ARC.sections) {
      expect(s.worked, `${s.id}: a panel stamp on a page with no switch`).toBeUndefined();
    }
  });

  /**
   * The talk's order: the claim first, the three shared beats at the
   * lecture's positions (their eyebrows letter 02 · 03 · 04), the evidence,
   * the turn, the close, and the whole thing inside the archetype's
   * seven-to-sixteen (ADR-131's law, one screen a section).
   */
  it("opens on the claim, closes on the close, and stays inside the law", () => {
    const sections = UX_MEETUP_ARC.sections;
    expect(sections[0].id).toBe("the-claim");
    expect(UX_MEETUP_ARC.hero.actions?.[0]?.href).toBe("#the-claim");
    expect(sections[1], "02 is the shared stages").toBe(THREE_WAYS_LOOP);
    expect(sections[2], "03 is the shared curve").toBe(THE_CURVE_BEAT);
    expect(sections[3], "04 is the shared spectrum").toBe(HARD_TO_STEER_BEAT);
    expect(sections.at(-1)?.kind).toBe("close");
    expect(sections.length).toBeGreaterThanOrEqual(7);
    expect(sections.length).toBeLessThanOrEqual(16);

    const ids = sections.map((s) => s.id);
    expect(ids.indexOf("tom-on-the-moon")).toBeGreaterThan(ids.indexOf("not-software"));
    expect(ids.indexOf("the-turn")).toBeGreaterThan(ids.indexOf("itp-wall"));
    expect(ids.indexOf("what-is-left")).toBe(ids.indexOf("the-turn") + 1);
  });

  /**
   * ⚠ THE EVIDENCE IS THE SHARED RECORDS, BY REFERENCE (one section, one
   * record). The nine-sector wall was the lecture's own picture until this
   * page showed it too; both pages read it now, and it is on disk.
   */
  it("mounts Tom on the Moon and the nine sectors by reference", () => {
    const sections = UX_MEETUP_ARC.sections;
    const path = sections.find((s) => s.kind === "path");
    expect(path?.kind === "path" && path.stages, "the Tom path").toBe(TOM_PATH_STAGES);
    const bench = sections.find((s) => s.kind === "bench");
    expect(bench?.kind === "bench" && bench.example, "the Tom bench").toBe(TOM_BENCH_EXAMPLE);
    const tomWall = sections.find((s) => s.id === "tom-scale");
    expect(tomWall?.kind === "media" && tomWall.media, "the Tom wall").toBe(TOM_WALL_MEDIA);
    expect(tomWall?.kind === "media" && tomWall.caption, "its caption").toBe(TOM_WALL_CAPTION);

    for (const arc of [UX_MEETUP_ARC, AP_HOGESCHOOL_ARC]) {
      const wall = arc.sections.find((s) => s.id === "itp-wall");
      expect(wall?.kind === "media" && wall.media, `${arc.slug}: the wall`).toBe(ITP_WALL_MEDIA);
      expect(wall?.kind === "media" && wall.caption, `${arc.slug}: its caption`).toBe(
        ITP_WALL_CAPTION
      );
    }
    expect(
      existsSync(join(process.cwd(), "public", ITP_WALL_MEDIA.src)),
      `${ITP_WALL_MEDIA.src} on disk`
    ).toBe(true);
  });

  /**
   * The house copy law, over what THIS PAGE letters of its own: its hero, its
   * card, its heads, lines and cards. The shared records answer to their own
   * pages' guards (Tom on the Moon's record says "wave", which is its word).
   */
  it("holds the copy law on its own words", () => {
    const faults: string[] = [];
    const visit = (value: string, path: string) => {
      for (const [pattern, why] of PROPOSAL_COPY_BANS) {
        if (pattern.test(value)) faults.push(`${path}: ${why}`);
      }
      if (/<\/?(i|em)\b/i.test(value)) faults.push(`${path}: markup in a copy string`);
    };
    const { sections, ...frame } = UX_MEETUP_ARC;
    scanStrings(frame, "arc", visit);
    scanStrings(UX_MEETUP_HERO, "hero", visit);
    scanStrings(UX_MEETUP_PROOF_LEDES["ai-transformation"], "ledes.ai-transformation", visit);
    const shared: readonly unknown[] = [THREE_WAYS_LOOP, THE_CURVE_BEAT, HARD_TO_STEER_BEAT];
    for (const section of sections) {
      if (shared.includes(section)) continue;
      const own = section as unknown as Record<string, unknown>;
      for (const key of ["menuLabel", "eyebrow", "head", "line", "subline", "cards", "actions"]) {
        scanStrings(own[key], `${section.id}.${key}`, visit);
      }
    }
    expect(faults).toEqual([]);
  });
});
