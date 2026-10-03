# Workshop V3: an intro that leads into the workshop (plan, not built)

Written 2026-10-03 for `/arcs/thoughtform/workshop-v3` (ADR-143). Approved in scope by the owner; the copy below is a first draft for his read before push. This file is the handover: everything a session on another machine needs is here or at the paths named.

## Context

On V3 the intro (About → eras → corridor → proof pile) still talks like the homepage. "We embed in your team until it runs without us" is a call to action, and each proof card carries four bullets written for someone browsing. The workshop is already sold (Suri, London, from 5 October), so the intro should be short and should read as a story:

1. I am an intelligence architect.
2. This is how I work: the Arc.
3. This is how I did it at Loop.
4. Now we go in depth. Navigate is the nature of AI, Encode is the skills and evals, Build is the configuration and the plugin.

**Owner rulings (2026-10-03):**

- **V3 only.** V1, V2 and the AP lecture keep today's intro. The homepage is untouched.
- **Keep the Arc's own words** (Navigate / Encode / Build, "intelligence configuration"). This overrides, for this page, the Suri sprint plan's list of words kept out of the room (`Arcs_Suri/delivery/2026-10-05-sprint-plan.md`).
- The last proof card keeps both readings (WORK and CONFIGURATION), with new copy and a glow.
- The headline ticker under the signal line is hidden on V3. Beat 09 shows the same news.

## Where each piece of intro copy lives today

The intro has four sources, and all of them are shared. That is why V3 needs override seams, each one identity when no override is passed, so the homepage stays byte-identical.

| What you see                                                        | Source                                                                                                                                                                                                                               | Who else reads it                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Hero, About text, contact                                           | `public/prototypes/v7/landing-thoughtform-workshop.html` (About at ~4272–4325: role 4290, three `.voidwalker__bio` paragraphs 4292–4309)                                                                                             | V1, V2, V3, AP lecture                           |
| Corridor thesis ("AI sits somewhere between tool and collaborator") | the homepage prototype `landing-v7-motion.html` `#definition` (~4331–4342), read by `lib/v7-parse/extractText.ts` into `corridorText.thoughtform` (`titleHtml`, `body1Html`, `body2Html`, `cta`)                                     | every corridor route                             |
| Navigate / Encode / Build captions                                  | `lib/home-v2/corridorMap.ts` `content.supportHtml` / `floorHtml` (navigate ~258, encode ~288, build ~326)                                                                                                                            | every corridor route                             |
| Signal line, ticker, button                                         | `components/landing/home-v2/CorridorStationHeaders.tsx`: `SIGNAL_CONTENT.titleHtml` (~853), `SIGNAL_TICKER_ITEMS` (~861, rendered ~1185), button label (~1258); phone copy hard-coded in `MobileEpilogueSignal.tsx` (~321, 341, 350) | every corridor route                             |
| Era stage ("The Intelligence Architect")                            | `lib/voidwalker/characterEras.ts` (~716) and `voidwalkerData.ts` (~141)                                                                                                                                                              | homepage and workshops; NOT changed by this plan |
| Proof cards                                                         | `lib/cases/content/loop-earplugs.ts`: titles `arc.title` (~2289, 2362, 2414, 2494), ledes `card.lede` (~2281, 2359, 2411, 2462), claims `blocks`                                                                                     | homepage, Trinny, Pandora, workshops             |
| Opening slide "Hand it to an agent."                                | `lib/arcs/content/shared/handItToAnAgent.ts` (the whole section)                                                                                                                                                                     | V2, V3, AP                                       |

Readers of the station copy: `CorridorStationHeaders` (desktop bands and caption card, reads `content` at ~352 and ~586), `StationTitle` (phone, ~45), `HomeCorridor` (no-WebGL fallback, ~254, 261). All of them mount inside `HomeCorridor` (`CopyAnchors` at ~169, `CorridorStationHeaders` at ~176; `CopyAnchors` mounts `StationTitle` and `MobileEpilogueSignal`).

How the proof pile reaches the workshop: `app/(marketing)/arcs/thoughtform/workshop-v3/WorkshopPortals.tsx` imports V1's `workshop-v1/WorkshopProof.tsx`, which renders `<ProofStack tracks={proofStackTracks()} client={proofStackClient()} arrival="glitch" />`. `ProofCard` prints `arc.title`, `card.lede` and the four `blocks` (it never prints `brief`). There is no per-card prop; the override precedent is `components/arcs/ArcProofCard.tsx` (~60–67), which spreads the record and replaces one field.

## One record

New: `lib/arcs/content/shared/workshopIntro.ts` exports `WORKSHOP_INTRO`. It is pure data, so the Suri cut and later cuts read it by reference (one section, one record). It holds:

- `about`
- `thesis`
- `stations`
- `signal` (including `ticker: false`)
- `proof` (the lede for each track, and which card is lit)
- `opening`: the V3 version of the opening slide

### Draft copy (for the owner's read before push)

No em dashes, no "X, not Y" titles, nothing from the voice skill's banned list (leverage, unlock, harness and the rest).

**About.** The role line is unchanged ("Creative Technologist · Founder · AI Adoption"), because the eras name the present. The text goes from three paragraphs to two:

- "**Vince** has spent a decade inside digital change: social media, online communities, now _intelligence itself._"
- "Today he maps which intelligence runs which work, inside the teams that do it: at **Loop Earplugs**, and for other teams through Thoughtform."

The second paragraph hands over to the era's motto, "Owning the map between work and intelligence."

**Thesis** (after the eras):

- Title: "My material sits between _tool_ and _collaborator_."
- Body: "An architect learns the material before building with it. This one talks back, fills gaps and gets things wrong in new ways."
- Body: "Fitting it to your work takes three moves."
- Button: "Enter the arc".

**Station captions.** Titles unchanged. Each caption's second line says which part of today it is:

- **Navigate:** "Learn how this _intelligence_ behaves before you hand it work.<br>Part one today: from a prompt to an agent, and why it is hard to steer."
- **Encode:** "Write down what your team knows and what _good looks like_.<br>Part two: the skills and the evals an agent runs on."
- **Build:** "Give each piece of work its _intelligence configuration_.<br>Part three: one motion ad, end to end, and the plugin your team installs."

**Signal line.** "WE DID IT FIRST AT LOOP EARPLUGS,<br>_TEAM BY TEAM, UNTIL THEY RAN IT._" The button reads "HOW IT WENT AT LOOP". No ticker.

**Proof cards.** The titles stay as they are (they match the strategy skill word for word), in the order frontier → tools → self-sufficient → layer. The ledes shrink to one line each:

- **Frontier:** "Two 30-second films made with generative models to the craft bar of live action, and run as paid media."
- **Tools:** "Four tools built with the people who run the work, where it got stuck. Those teams own them."
- **Studio:** "Embedded in the studio until the team ran paid social with AI on its own."
- **Layer:** "Then we built for the agents: what each team knows, written down, and the checks they run on their own work. The rest of today is how."

Claims show their titles only on V3. Each claim's sentence stays in the DOM for screen readers but is visually hidden.

**Opening slide** (01, the configuration board). The title "Hand it to an agent. / Trust what comes back." and the board stay. New sub:

"Today follows the Arc: how this intelligence behaves, what your team writes down for it, and one piece of work set up to run on its own, from a prompt to a ten-second ad."

This removes the repeat of "three ways" (beat 02 covers it) and the how-to framing.

## Changes

1. **About.** A pure helper in `app/(marketing)/arcs/thoughtform/workshop-v3/` replaces the `.voidwalker__bio` paragraphs inside `#about` with `WORKSHOP_INTRO.about`.
   - It is applied in V3's `page.tsx`, beside the existing station-removal step.
   - It throws if it finds no markers, so a miss never silently shows the old text.
   - `useWorkshopFlow` (`workshop-v1/flow/useWorkshopFlow.ts` ~108–111) collects the paragraphs with `querySelectorAll`, so it works with any count.
2. **Thesis.** V3's `page.tsx` passes `extractV7Text()` with `thoughtform.{titleHtml, body1Html, body2Html, cta}` overridden. That prop is already threaded through `LandingPage` → `HomeCorridor` → `CopyAnchors`, on desktop, phone and the fallback.
3. **Station captions and signal.**
   - Add an optional `copy?` to `V7CorridorText` (`lib/v7-parse/types.ts`).
   - New `lib/home-v2/corridorCopy.ts` (pure): the defaults are the current `CORRIDOR_MAP` supports and `SIGNAL_CONTENT` / button / ticker, plus a merge.
   - `HomeCorridor` provides it through a small context. `CorridorStationHeaders`, `StationTitle`, `MobileEpilogueSignal` and the fallback in `HomeCorridor` all read from it, in place of the constants.
   - With no `copy`, the result equals today's values, so the homepage is byte-identical. `LandingPage` must stay render-stable (`.claude/rules/landing-v7.md`): the override is a static prop, nothing subscribes.
4. **Proof pile.**
   - New `workshop-v3/WorkshopProof.tsx` maps `proofStackTracks()` and replaces only `card.lede`. This is the `ArcProofCard` record-spread precedent.
   - V3's `WorkshopPortals.tsx` imports it in place of V1's.
5. **Concise claims and the glow.** These are CSS rules in V1's route sheet (`workshop-v1/thoughtform-workshop.css`), scoped to `.tw-root[data-tw-cut="v3"]` and winning on specificity, never on order (ADR-141 U1). V3's `page.tsx` stamps `data-tw-cut="v3"` on its `.tw-root`.
   - Claim sentences are visually hidden but stay readable to screen readers.
   - The glow applies to `.pf-card[aria-labelledby="pf-card-ai-transformation"]`, in dark only:
     - the lip ring at full `--gold-line` (`--pf-lip` is a 30 % mix today, `proof-stack.css` ~66);
     - `--pf-bloom-a` raised from .13 to about .24 (`proof-stack.css` ~69, 287–291);
     - on the title, the corridor title's phosphor `text-shadow` (`0 0 22px rgba(var(--gold-rgb), .18)`, `home-v2.css` ~1686);
     - `--con-mark-glow` on the lit station and the claim glyphs (`console.css` ~97, off on this card today at `proof-stack.css` ~1257).
   - Constraints from `.claude/rules/proof-stack.md`: no animation, no `filter` (it blinds the card's `backdrop-filter`), no luminance flicker, tokens only. Light resets all of it, the way `--con-mark-glow` goes to `none` in `theme.css` (~733).
6. **Opening slide.**
   - V3's first section becomes `WORKSHOP_INTRO.opening`, which spreads `HAND_IT_TO_AN_AGENT` with the new head (same `id`, `kind`, `lit`).
   - `arcs-registry.test.ts` then lists only V2 and AP as readers of `HAND_IT_TO_AN_AGENT`.
   - `thoughtform-workshop-v3.test.ts` (~84) pins the opening to `WORKSHOP_INTRO.opening` instead.
7. **Docs and memory.**
   - ADR-143 gets U3, "the intro leads into the workshop": the seams, the copy record and the V3-only scope.
   - `.claude/rules/arcs.md` gets a bullet for ADR-143 U3.
   - `CLAUDE.md` lists `workshopIntro.ts` in its standing records.
   - Memory: `workshop-v3-house-template.md`.

## Tests

- **New `tests/lib/workshop-intro.test.ts`:**
  - Every string passes the copy law: no em dash, no voice-skill banned words, no digits other than "30-second" in the frontier lede.
  - Ledes are at most 180 characters (the `cases-registry` bound).
  - Each caption has exactly one `<br>`, and the signal title has one `<br>` and one `<em>`.
  - The opening keeps `id`, `kind` and `lit` from `HAND_IT_TO_AN_AGENT` and changes only `head`.
- **About helper:** it rewrites the real workshop prototype (the paragraph count changes, the role is unchanged) and throws on markup without `#about`.
- **`corridorCopy`:** the defaults equal `CORRIDOR_MAP` and `SIGNAL_CONTENT` verbatim, which is the homepage identity, and the merge applies an override.
- **Updates:** `thoughtform-workshop-v3.test.ts` and `arcs-registry.test.ts` (the readers lists).

## Verification

1. `npx vitest run` on the new and touched tests, then `npm run verify` (the lint ratchet sits at 336 of 337 warnings; one new warning fails main).
2. Walk the page at `http://localhost:3003/arcs/thoughtform/workshop-v3` (read the port off the running server), in dark and light, at 1920×1247 and 1280×720.
   - The About, the name gliding onto the era title, the thesis, the three captions inside the caption card, and the signal line without a ticker.
   - The four cards: titles only on the claims, and the glow on card 4 in dark only.
   - The opening slide.
   - Screenshot each beat.
3. Phone at 390×844: the thesis, captions, mobile signal block and cards.
4. Byte-identity checks:
   - `/` keeps its captions, its "WE EMBED…" line, its ticker, and the card ledes and claims, checked as DOM text.
   - V2 keeps its old About and its opening sub.
   - `npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop` passes unchanged.
5. Commit by path (`git commit -- <paths>`; the tree is shared, never stash). Push only on the owner's word: the site is live.

## Sources for the voice

- Wispr Flow notes: "Thoughtform Arc structure" (2026-10-03, id `2618bc36`), "Thoughtform Praxis Workshop" (2026-09-28, id `bc397070`), "Thoughtform positioning notes" (2026-09-27, id `683e6cdb`).
- The strategy skill's Loop story, word for word: `thoughtform-strategy/references/07-proof-cases.md` (~17–20). Its role line: `references/06-role-pitch.md`.
- The voice skill's hard bans: `thoughtform-tov/SKILL.md`.
- Source decks already on the site: `making-your-agents-reliable.html`, `prompt-to-loop.html`. On the owner's machine they are in `C:\Users\buyss\Downloads\evals arcs`.
