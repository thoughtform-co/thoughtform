# ADR-151: The Suri and Plopsa setup guides, the practical companion to the configuration

- **Status:** Proposed (2026-10-07, owner). Built and guarded, not pushed; flips to Accepted once
  the owner has read `/arcs/suri/guide` and `/arcs/plopsa/guide` live.
- **Surface:** `lib/arcs/content/suri-guide.ts`, `lib/arcs/content/plopsa-guide.ts` (new);
  U1: `components/arcs/ArcGuide.tsx`, `components/arcs/guide.css` (new), the `guide` kind in
  `lib/arcs/types.ts`, its case in `ArcSectionRenderer` and its `GUIDE` designation in `chrome.tsx`,
  `guide.css` imported on both arc routes;
  `lib/arcs/registry.ts` (two entries, each first in its client); `HERO_ROUTES` and its test (two
  rows, the gateway plate); `sheet-arcs`, `sheet-composition`, `sheet-instrument` (the real
  overview's day moves to the newest filing, and the newest pick tolerates a same-day tie).
- **Related:** [ADR-148](148-the-suri-setup-page-and-the-workshop-frame.md) (the configuration
  page this one extends), [ADR-130](130-the-workshop-frames-the-loop.md) (the Plopsa workshop and its IT
  beat), [ADR-118](118-the-arcs-overview-is-an-instrument.md) (filing dates).

## The call

The owner, 2026-10-07: "for both suri and plopsa i want a simple page that explains very clearly
and concisely the steps of plugins / marketplace / skill / github and vercel to host api keys /
route feedback. It'd basically be an extension of the suri configuration page … really focused on
the practicals with obviously a section or two that explains the vision behind it".

## The decision

**1. One page per client, at `/arcs/<client>/guide`.** The configuration page says how the setup
thinks; the guide says who clicks what, in which order. Suri's is in English, Plopsa's in Flemish,
as each client's other pages are.

**2. Eight beats, the same on both.** 01 why (a callout: the tools change, the judgment stays in
the client's files), 02 the three principles (their own accounts, written down, it learns),
03 the parts (skill, plugin, marketplace, GitHub, the Claude organisation, Vercel), 04 the steps
from GitHub to the team, with the zip as the stopgap and the change loop as tips, 05 where the
keys live (model keys in `.env` from the password manager, the connector's in Vercel's settings,
the triage's token in GitHub's secrets), 06 how a remark travels from `/skill-feedback` to a
merged fix, 07 what IT sets up once, 08 the close pointing at the repository's own docs.

**3. Content only.** Superseded by U1: the cards are gone.

**4. Every step is the plugin repository's own,** read on 7 October from `suri-ai-studio`
(`docs/SETUP.md`, `docs/FEEDBACK.md`, `docs/COWORK.md`, `connector/README.md`,
`docs/google-ai-setup-for-IT.md`) and `plopsa-ai-studio` (`docs/SETUP.md`,
`docs/CHANGING-A-RULE.md`, the marketplace). Each repository words Claude's menu path its own
way, and each page keeps its own repository's words.

**5. Plopsa's feedback beat is drawn as what follows.** Plopsa's repository has no connector and
no `/skill-feedback` yet, and is still under Thoughtform's GitHub account. The beat carries the
state chip "Volgt" and a tip for until then (tell us, or change the rule in the file that owns it
through a pull request).

## Update 1 (2026-10-07, owner): every beat its own drawing

The owner, on the first cut: "why does every section look the same … Make it visually clear;
clean information architecture … NO AI SLOP", naming the "Eén stuk werk, opgeschreven" title
pattern and the glossary that set the TERM in small mono and its gloss in large type, so the two
did not read as one thing. References: Linear, Cofounder, and Prompt to Loop's "Where it lives"
slide (a drawing with numbered pins beside a numbered legend).

- **The `guide` kind, ADR-052's twenty-seventh enumerated exception** (`ArcGuide`, `guide.css`),
  one kind with four views, each its own drawing:
  - **map**: the system as nested frames (GitHub ⊃ marketplace ⊃ plugin ⊃ skills), then Claude,
    then the team, with the feedback lane as a U back into the repository through the Vercel
    connector; numbered gold pins tie each part to a three-column glossary under it, where the
    term is the large type and its meaning the small. A part not built yet is a dashed frame
    with its state.
  - **checklist**: phases (Before, Connect, Feedback, Then) of ruled rows: `1.1`, the step at
    20px with one line under it, then who (a chip) and where (the menu path as crumbs). Only what
    is on record as done carries a green check.
  - **matrix**: each key against five places, two of them marked never; a gold square where it
    lives.
  - **pipeline**: the stations a remark passes, a person's node filled green, a machine's ringed
    in gold, and the line that closes the loop.
- **The pages are six beats:** the callout, then map, checklist, matrix, pipeline, close. The
  principle cards and the IT cards are folded into the callout and the checklist's phases.
- **No title is a slogan.** Titles say what the beat shows ("How the parts fit together.",
  "Where each key lives."); the step titles are imperatives; glossary lines are sentences.
- **Gold as text reads `--gold-ink` in light** (`--g-gold-text`), because `--gold` on the light
  ground is under 2:1.
- Server, no state, DOM only. Checked at 1470×830 in both themes and at 375 wide (no
  horizontal scroll; the map stacks, the matrix becomes each key with where it lives and where
  never, the pipeline runs down).

## Update 2 (2026-10-07, owner): one screen per beat, the overview, links

The owner on U1: make every beat fit one section; the overview should read like Aether's layer
panel (`tensalir/aether`, `components/landing/substrate.tsx`); remove the glossary blocks; the
steps must link to where they are done. References: the Tensor Lake reel (a drawing on top, words
under it, one accent, hairline cells, air) and Lighthouse.

- **The map is replaced by the OVERVIEW**: one panel, three cards (GitHub, Claude, Vercel), each
  a tab on its top edge, a title, one line and one simple drawing: the terms as a table, the
  four places the team meets it as tiles, the feedback as a four-step rail; three tags under the
  panel. The glossary blocks and the numbered pins are deleted; the terms live in the GitHub
  card's table. A card for a part not built yet is dashed and says so.
- **The checklist is four columns, every step a link**: the phases side by side in one ruled
  sheet, each step a checkbox, its title a link (↗, a new tab) and one short line. The role
  lives in the phase head; a step names its role only when it differs. Links go to Anthropic's
  documented settings pages (`claude.ai/admin-settings/skills?tab=inventory`,
  `?tab=marketplaces`), `github.com/apps/claude`, the client's repository pages, AI Studio,
  Google Cloud and Vercel.
- **Measured at 1470×830**: the overview, the steps, the keys and the feedback beats are each
  830px, one screen. At 375 wide there is no horizontal scroll.

## Update 3 (2026-10-07, owner): no frames, one drawing

The owner on U2's overview: "no boring frames; i want a nice visual flow. this is a glorified
word document". The three framed cards are deleted. The overview is ONE DRAWING, with the words
under it the way Tensor Lake sets a figure over its caption:

- **The spine**: a gold line from the repository through the one lit object, the Claude
  organisation (a gold ring over the wash), with the sync word on the line; past it a bus and
  four stubs fan into the surfaces (Chat, Desktop, Cowork, Claude Code).
- **The repository** is three strata, the skill on top, the marketplace at the base, filled and
  never framed. **The loop** is a dashed U under the spine, from under the surfaces back under
  the repository, with the connector sitting on its floor; a pending connector is marked and dimmed.
- **The lines are DOM** (the spine segments live in the grid's gap columns; the fan's bus and stubs
  are pseudo-elements; the loop is a bordered box), so every collapse guard measures them. The
  nodes are opaque, so the loop's legs read as entering them.
- **Under the drawing**, three columns of words aligned to the three nodes, and the three tags.
- On a phone the drawing stands up: the spine runs down the page in reading order (the DOM puts
  the lines first, so the phone layout orders the nodes), the fan and the loop are dropped, and the
  connector is said with ↺.
- Measured at 1470×830: 830px on both pages; at 375 wide no horizontal scroll.

## Left open

- "Vercel to host API keys": on both pages Vercel holds the connector's own secrets only. The
  model keys (Gemini, and OpenAI at Plopsa) stay in `.env` on the laptop, because that is what the
  skills read today. If the model keys are to move behind a Vercel service, that is a change to the
  skills first, then to beat 05.
- Plopsa's sign-in: the kit's connector signs in with Google Workspace. Whether Plopsa runs on
  Google is not on file, so beat 07 says "een project voor de aanmelding" without naming Google.
- `DUTCH_ARCS` in `arcs-registry` lists Dutch pages by slug; `plopsa-guide` is not on it yet, so
  the counting-title and "plaat" guards do not walk it. Its copy was written to them by hand.
- `SURI_REPOSITORY_BODY` (`shared/suriWork.ts`) still draws three plugins (`ai-studio-strategy`,
  `ai-studio-design`) that 0.3.0 folded into `ai-suri`; the guide says one plugin.
- Unchanged by this: `skill-file-fidelity` and `thoughtform-armada` fail on the clean tree
  (ADR-148, Left open).
