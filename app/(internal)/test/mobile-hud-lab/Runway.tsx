"use client";

/**
 * The synthetic phone runway — five blocks of REAL copy standing in for
 * the landing page's stations, carrying eight journey parts between them.
 *
 * ⚠ IT IS NOT THE PRODUCTION COMPONENTS, DELIBERATELY. The question this
 * lab asks is whether a new fixed painter collides with flowing copy in
 * the two chrome bands, and the cheapest honest way to ask it is a
 * document with text at the band edges. Mounting the real stations would
 * drag in the corridor — which is WebGL, needs a real scroll to advance
 * its frameloop, and dies in a headless capture — for a runway this lab
 * only needs to be tall, dense and scrollable. `/test/hud-instruments-lab`
 * mounts the real frame because its subject IS that markup; this one's
 * subject is two elements that exist nowhere yet.
 *
 * ⚠ THE BLOCKS CARRY THE REAL `.station` CLASS, WHICH IS THE POINT. That
 * is what puts them under landing.css's ≤960 padding FLOOR — the last rule
 * in the file, `max(var(--station-pad-top, 140px), var(--mobile-chrome-top))`
 * — so the runway reserves the two chrome bands by the same mechanism
 * production does, not by a number copied into the lab sheet. Each block
 * declares `--station-pad-*: 0px` (in the lab sheet), so the floor resolves
 * to EXACTLY the band: copy starts on the band's edge, which is the worst
 * case the collision gate should be measuring.
 *
 * ⚠ AND THE COPY IS DENSE AT BOTH ENDS ON PURPOSE. `.station`'s own
 * `justify-content: center` would otherwise park a short block's text in
 * the middle of the viewport, nowhere near either band — a runway that can
 * never fail the test it exists to run.
 */

import { RUNWAY_PARTS, type RunwayBlockId } from "./variants";

/** The parts belonging to one block, in document order. */
const partsOf = (block: RunwayBlockId) => RUNWAY_PARTS.filter((p) => p.block === block);

/**
 * A journey part. `data-mhl-row` is what the shell's IntersectionObserver
 * watches — a rect the reader can actually see, which is
 * `.claude/rules/mobile-sections.md` law 2's requirement for anything that
 * decides what fixed chrome says.
 */
function Part({
  block,
  n,
  className,
  children,
}: {
  block: RunwayBlockId;
  /** Which of the block's parts this is, 0-based. */
  n: number;
  className?: string;
  children: React.ReactNode;
}) {
  const part = partsOf(block)[n];
  return (
    <div className={`mhl-part${className ? ` ${className}` : ""}`} data-mhl-row={part.row}>
      {children}
    </div>
  );
}

export function Runway() {
  return (
    <div className="mhl-runway">
      {/* ── 01 · HERO ─────────────────────────────────────────────────
          A one-viewport curtain. Its meta row sits hard on the bottom
          band, which is where the astrolabe seats — the first collision
          worth looking at. */}
      <section id="mhl-hero" className="mhl-block mhl-block--hero station" data-mhl-block="hero">
        <Part block="hero" n={0}>
          <p className="mhl-eyebrow">Thoughtform · Antwerp</p>
          <h1 className="mhl-display">
            Intelligence you can <em>navigate</em>
          </h1>
          <p className="mhl-lede">
            Most teams buy access to a model and call it a strategy. The work is upstream of that:
            deciding which judgement is worth encoding, and who stays the taste-gate once it is.
          </p>
        </Part>
        <p className="mhl-meta">
          <span>Est. 2024</span>
          <span>51°13′N 4°24′E</span>
          <span>Scroll</span>
        </p>
      </section>

      {/* ── 02 · CORRIDOR ─────────────────────────────────────────────
          The tall one — three viewports of travel under a single journey
          row, so the strip's detent has somewhere long to sit still. */}
      <section
        id="mhl-corridor"
        className="mhl-block mhl-block--corridor station"
        data-mhl-block="corridor"
      >
        <Part block="corridor" n={0}>
          <p className="mhl-eyebrow">The Arc</p>
          <h2 className="mhl-title">Navigate · Encode · Build</h2>
          <p className="mhl-body">
            The corridor is one continuous move through three beats. Navigate is where the work is
            mapped: what a person actually does in a week, and which parts of it are judgement
            rather than throughput.
          </p>
          <p className="mhl-body">
            Encode is where that judgement becomes something a model can run — not a prompt, a
            configuration: the vocabulary, the anchors, the rubric, the eval that says when the
            output is wrong.
          </p>
          <p className="mhl-body">
            Build is the part everyone starts with and almost nobody finishes, because a tool
            without an encoded standard is a faster way to produce work nobody trusts.
          </p>
          <p className="mhl-body mhl-body--far">
            Three beats, one clock. The reader experiences it as a single descent, which is exactly
            why the frame must not step its marker three times on the way down.
          </p>
        </Part>
      </section>

      {/* ── 03 · CASEFILE ─────────────────────────────────────────────
          The dense one: a register, a directory, a claim grid. Small mono
          at both ends, which is the copy the TR readout and the BR
          cluster actually land on today (KNOWN_CHROME_COLLISIONS in
          mobile-section-seams.spec.ts pins #services for both). */}
      <section
        id="mhl-casefile"
        className="mhl-block mhl-block--casefile station"
        data-mhl-block="casefile"
      >
        <Part block="casefile" n={0}>
          <p className="mhl-eyebrow">Proof · Client casefile</p>
          <div className="mhl-tabs">
            <span data-on="">Loop Earplugs</span>
            <span>Dioss</span>
            <span>In The Pocket</span>
          </div>
          <h2 className="mhl-title">The intelligence map</h2>
          <ul className="mhl-dir">
            <li>
              <span>01</span>THE WORK<i>27 streams</i>
            </li>
            <li>
              <span>02</span>THE CONFIGURATION<i>Skill · model · reach</i>
            </li>
            <li>
              <span>03</span>THE SUBSTRATE<i>47 encoded</i>
            </li>
            <li>
              <span>04</span>THE EVIDENCE<i>Sheets · films · tools</i>
            </li>
          </ul>
          <div className="mhl-claims">
            <p>
              <b>Briefings that survive review</b>
              The brief a strategist would have written, from the sources they would have read.
            </p>
            <p>
              <b>One voice across nine markets</b>
              Translation is the easy half; the register is the half that gets a campaign pulled.
            </p>
            <p>
              <b>Ads at the pace of the feed</b>
              Diversification the platform can actually tell apart, not eight crops of one photo.
            </p>
            <p>
              <b>The standard, written down</b>
              Every configuration records what good looks like and how it is checked.
            </p>
          </div>
        </Part>
        <Part block="casefile" n={1} className="mhl-part--offer">
          <p className="mhl-eyebrow">Services</p>
          <h2 className="mhl-title">Four ways in</h2>
          <ul className="mhl-verbs">
            <li>
              <b>Advisory</b>The operating model, the map, and what not to build.
            </li>
            <li>
              <b>Embedded</b>A seat inside the team until the capability is theirs.
            </li>
            <li>
              <b>Keynote</b>The argument, made to a room that has to act on it.
            </li>
            <li>
              <b>Workshop</b>One day, one real workflow, encoded before anyone leaves.
            </li>
          </ul>
          <p className="mhl-fine">
            Engagements run on evals, not enthusiasm. The deliverable is a capability that keeps
            working after the invoice clears.
          </p>
        </Part>
      </section>

      {/* ── 04 · ERAS ─────────────────────────────────────────────────
          The bio running into the through-line, with a horizontally
          scrolling chip band — a row that must not be nudged by anything
          fixed sitting over it. */}
      <section id="mhl-eras" className="mhl-block mhl-block--eras station" data-mhl-block="eras">
        <Part block="eras" n={0}>
          <p className="mhl-eyebrow">About</p>
          <h2 className="mhl-title">Vince Buyssens</h2>
          <p className="mhl-body">
            Fifteen years of making things for people who had not asked for them yet — agency
            creative, community builder, guild leader, generative artist, and now the seat between a
            business and the intelligence it is trying to use.
          </p>
          <p className="mhl-body">
            The through-line is not the tools. It is the habit of building the instrument before
            building the thing, so the thing can be judged.
          </p>
        </Part>
        <Part block="eras" n={1}>
          <p className="mhl-eyebrow">Voidwalker</p>
          <div className="mhl-eras">
            <span>Creatives · 2014</span>
            <span>The Crowd · 2016</span>
            <span>Azeroth · 2020</span>
            <span data-on="">Latent Land · 2022</span>
            <span>Thoughtform · 2025</span>
            <span>Architect · 2026</span>
          </div>
          <p className="mhl-body">
            Six eras, one record. Each one is a real body of work with a date on it, which is why
            the band can be read as evidence rather than as a career narrated after the fact.
          </p>
          <p className="mhl-fine">
            Selecting an era loads its model. Nothing here is a portrait — it is a log entry with a
            face.
          </p>
        </Part>
      </section>

      {/* ── 05 · CONTACT ──────────────────────────────────────────────
          The document's end. Its social row is the LAST ink on the page
          and it sits directly over the bottom band — the case the footer
          floor exists for, and the astrolabe's real neighbour. */}
      <section
        id="mhl-contact"
        className="mhl-block mhl-block--contact station"
        data-mhl-block="contact"
      >
        <Part block="contact" n={0}>
          <p className="mhl-eyebrow">Practice</p>
          <p className="mhl-body">
            Writing, tools and the occasional exhibition. The practice is where the method gets
            tested on work that has no client to please.
          </p>
        </Part>
        <Part block="contact" n={1} className="mhl-part--foot">
          <p className="mhl-eyebrow">Contact</p>
          <h2 className="mhl-display mhl-display--sm">Plot your approach</h2>
          <p className="mhl-body">
            Bring the workflow you would least like to explain to a stranger. That is usually the
            one worth encoding first.
          </p>
          <p className="mhl-mail">hello@thoughtform.co</p>
          <p className="mhl-social">
            <span>LinkedIn</span>
            <span>GitHub</span>
            <span>Substack</span>
            <span>Colophon</span>
          </p>
        </Part>
      </section>
    </div>
  );
}
