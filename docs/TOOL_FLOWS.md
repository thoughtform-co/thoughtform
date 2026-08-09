# Software for Few — the four tools' product flows

A reference for building thoughtform.co surfaces that present the four
production tools (Mímir · Vesper · Babylon · Heimdall). Everything here was
read from the tools' own codebases on **2026-08-09** — not from their
READMEs, several of which are stale (flagged per tool). If a future page
needs deeper detail, the repos live beside this one:

| Tool                   | Repo (local)                                       | Dev port |
| ---------------------- | -------------------------------------------------- | -------- |
| Mímir — Briefing Agent | `Manifold Delta/Artifacts/mimir`                   | 3847     |
| Vesper — Image & Video | `Manifold Delta/Artifacts/loop_vesper/Loop-Vesper` | —        |
| Babylon — UGC Dubber   | `Manifold Delta/Artifacts/loop_babylon`            | 3777     |
| Heimdall — Studio PM   | `Manifold Delta/Artifacts/11_Heimdall`             | 3846     |

**How this relates to the landing.** `PROJECT_CASES`
(`components/landing/v7/tools-cards/toolCardData.ts`) is the canonical
public copy for the four tools; the casefile wireframes
(`casefile/wireframes/`, ADR-068) are AUTHORED abstractions whose lettered
labels are schematic, not product strings. This doc is the bridge: what the
tools actually do, in their own vocabulary, so a new surface can be accurate
without re-reading four codebases.

**Confidentiality.** This doc stays inside the envelope that governs the
public page (`.claude/rules/proof.md`): tool codenames are published
precedent; no client individuals' names, no spend figures, no internal
board/doc links in anything lifted from here onto a public surface.

---

## Mímir — the Briefing Agent

**What it is.** A "newsroom for Loop": a research, briefing and
creative-intelligence workspace for paid social. Creative strategists browse
a daily feed of signals, pull evidence into a basket, generate a structured
creative brief from that evidence with Claude, then push the finished brief
into Monday.com — and, for Studio work, queue a Figma page via Heimdall.

**Stack + scale.** Next.js 16 App Router, React 19, Supabase (auth +
Postgres + pgvector), Anthropic SDK for generation, Gemini for concept
images. 53 page routes, ~180 API handlers, ~97 migrations. Integrations:
Monday GraphQL, Meta Ads Library, Exa (discovery), Figma REST (via
Heimdall's queue), BigQuery, Frontify.

**The flow.**

1. **Evidence accumulates upstream.** The Insights Feed, Personas wiki,
   Customer Reviews, Loop Ads and Bookmarks all feed a persistent basket
   (`BriefContext` / `BriefShelf`); the shelf's CTA `Compose brief →`
   carries the selection into the composer.
2. **The composer** (`/briefing-assistant/create-ads`) is TWO panels —
   `BriefingSourceRail` (left, "Briefing inputs · Evidence selected for
   generation · {n} pulled") and `BriefingComposer` (the brief). The assets
   panel is a dialog, not a third rail (the README's "three-panel composer"
   is stale). Ids the rail can't hydrate render as **"Legacy source"**.
3. **`Generate briefing from {n} inputs`** — the money moment. One
   full-width CTA collapses heterogeneous evidence into the brief
   (`POST generate-briefing`, `mode: 'brief'`).
4. **The brief takes shape** in sections: Idea · Why · Audience · Product ·
   Formats (real checkboxes: carousel/image/video in 9:16 + 4:5, 1:1) ·
   Variants · Note · Visual Direction · Copy Info · Testing. A "Grounding"
   ribbon shows matched context lines + similar past briefs (KG-backed).
5. **`Generate variants`** is a deliberate SECOND pass (strategist feedback,
   2026-05): gated on Idea + Audience + Product being filled; renders into a
   variant table (A–D: type + visual direction + copy direction + script).
6. **`Save & send to Monday`** — the outcome moment: creates the Monday
   item, patches status/assignee columns, writes the brief as a **Monday
   Doc** in the doc column, and (Studio only) queues the Figma page with an
   idempotency key. The **STUDIO / UGC** toggle switches the target
   board/group/doc column — UGC never queues Figma.

**Source taxonomy — three coexisting lists** (the part most likely to be
mis-described):

- `SourceType` (12 values) — composer-level input types
  (`createBriefingTypes.ts`).
- `INTERNAL_PREFIXES` — the id grammar (`story:` `loopad:` `review:`
  `reviewcluster:` `persona:` `monday:` `insight:` `buyerfeedback:` …).
- `EvidenceKind` (23 values) — the basket's presentation taxonomy,
  including the eight `nugget:{kind}:{hash}` persona-wiki atoms
  (pain_point, trigger_moment, alternative_tried, life_transformation,
  why_loved, common_word, golden_nugget, angle).

The source picker's user-facing tabs are: **All · Monday · Loop Ads ·
Reviews · Personas · Insights**. The landing wireframe's ADS DATA / REVIEWS
/ REDDIT / BLOGS titles map onto the evidence estate like this: ads data =
Loop Ads (own experiments, ROAS) + the Meta Ads Library; reviews = customer
reviews + clusters; **reddit = Social Listening** (Exa queries like
`site:reddit.com earplugs …`, currently nav-hidden); **blogs = Trends**
(Exa verticals + digest synthesis, currently nav-hidden).

**The feed.** Categories like "The Pattern", "Customer Voice", "Culture",
"Competitor Watch", "The Look" are TAGS on feed stories, interleaved from
curated narratives, Loop Ad batches, review clusters and personas
(`assembleFeed.ts`). Under the creative-strategist lens, the lead cards are
nightly Claude-skill output with their own tag set (Hook · Objection ·
Desire · Iteration).

**Gotchas.** README's route/page counts and "three-panel" description are
stale — trust code. `create-ads` is deliberately NOT in the sidebar (only
reachable from the shelf, personas, briefings, drafts, detail pages).
`nugget:` ids resolve in the shelf's resolver but not the rail's — they can
render as "Legacy source" in the composer.

---

## Vesper — Image & Video

**What it is.** Loop Studio's internal AI image/video generation workspace.
Work is scoped Project → Session; a designer prompts in a bottom-docked
composer, optionally rewrites the prompt through a Claude-powered enhancer
backed by the `genai-prompting` Skill, picks a model, and results stream
into the session feed in real time.

**Stack + scale.** Next.js 14, Prisma over Postgres, Supabase (auth,
storage, realtime), TanStack Query + Virtual, Anthropic + Vertex +
Replicate + Kling + OpenAI adapters. 22 pages, ~150 API handlers, ~50
Prisma models. (Internal npm package name is `prism` — scaffold leftover.)

**The session model.** A **virtualized vertical feed, NOT an infinite
canvas** — no pan/zoom anywhere. Each generation renders as a prompt card
(prompt text click-to-copy, author, model + provider chip, generated date,
reference-image thumbnail, a small Rerun link) beside its outputs. Outputs
carry bookmark and approval toggles (approvals feed `/review`); an async
analysis pass captions each output with Gemini and structures it with
Claude.

**The composer** (`ChatInput.tsx`), bottom-docked:

- Reference strip with `{n}/{max}` counter — 14 refs on Nano Banana Pro/2
  and Seedream 4.5, 16 on GPT Image 2 — fed by upload, browse, the **PDF
  Bucket** rail (images extracted from briefing PDFs), or **Product
  Renders** (the Loop catalogue: name, colorway, angle, render type;
  `local | frontify` source).
- The textarea ("Describe an image and click generate, or drag and drop
  images here…") with two icon buttons inside it:
  - **Prompt Enhancement (the wand)** — the money moment. `POST
/api/prompts/enhance` → a single enhancement service whose system
    prompt resolves DB override → **the `genai-prompting` Skill** →
    fallback. The same Skill runs behind Claude.ai and this button — that
    is the product's thesis. Model-specific strategies (style-reference
    prefixes for Nano Banana, motion prompts for video models); the rewrite
    lands via a glitch-morph animation, and Generate is hard-blocked while
    enhancing so a stale prompt can never ship.
  - **Iteration Slate (layers)** — "Create iterations (Andromeda-aware)": a
    slate of meaningfully different ad variants that locks anchors
    (product, offer, audience, brand) and varies 2–3 diversification axes.
- Parameter row: **ModelPicker** ("Select AI Model" — pinned by default:
  GPT Image 2, Nano Banana Pro, Nano Banana 2), Product Renders button,
  aspect ratio, resolution, mask upload (edit models), `⌘+Enter` hint.
  There is NO visible image-count control (`numOutputs` is auto-clamped
  state; the control component is dead code).
- **Generate** — creates `Generation` + `GenerationJob`; results land via
  Supabase Realtime with polling fallbacks.

**Models.** 9 registered configs over 4 adapters — Google (Nano Banana
Pro/2, Veo 3.1), Replicate (Seedream 4.5, Reve, Kling 2.6 Pro, NB Pro
backup), Kling official, OpenAI (GPT Image 2). Image AND video: an
"Animate Still" overlay (image→video), begin/end frames, snapshot rail, and
a timeline sequencer (tracks/clips/transitions/captions/render jobs).

**Cost.** No credits system and no meter in the product: real per-generation
USD cost is recorded on the row and surfaced only on `/analytics` ("Total
Spent"), plus per-provider rate limits (RPM + monthly caps). Any public
surface stays qualitative about cost (the casefile's "Never a price." law).

**Screens.** Dashboard, `/projects/[id]` (the actual product),
`/analytics`, `/bookmarks`, `/review`, `/product` (+ CMF, packaging),
`/headless` (API + MCP + downloadable `genai-prompting.skill` bundle).
`Briefings` and `Brand World` are parked placeholders — don't present them
as live.

---

## Babylon — the UGC Dubber

**What it is.** A localization hub, opening on a three-tool chooser —
**Video Localizer** (the main arm), **Localization** (Figma copy), **UGC
Naming**. The video arm takes UGC creator videos out of Monday Creative
Briefs (with Frontify links) and runs transcribe → translate → dub →
captions → QA → review → push back to Frontify.

**Stack + scale.** Next.js 14, Supabase (Postgres + RLS + storage + auth),
ElevenLabs (TTS + Dubbing API), Gemini/OpenAI/Claude for
transcription/translation/QA, Remotion for rendering, Twick timeline. ~120
API handlers.

**Three stage vocabularies — do not conflate:**

- `JobStatus` (DB state machine): pending · uploading · transcribing ·
  translating · dubbing · captioning · qa · review · approved · failed.
- `JobStep` (runnable actions): transcribe · translate · dub · captions ·
  qa · verify · review · push_frontify.
- `PipelineStepId` (the stepper UI): **Transcribe → Translate → Dub →
  Approved** in the default dub-and-captions mode (captions-only shows
  Transcript → Translate → Captions → Ready). Steps carry states including
  `stale` (invalidated upstream) and `rerun_needed` (reviewer-flagged).

**The editor** (`/app/jobs/[id]`) — a 50/50 grid:

- Left: the stepper; `Source` badge, `Target` language badges, `Voice`
  picker, `Dubbing` mode ("Natural auto" is literal — **Natural voiceover**
  = TTS-first vs **Lip-sync match** = ElevenLabs Dubbing, auto-resolved
  when not chosen); a split action button whose primary is the next
  non-blocked step (`Re-{step}` variants in the dropdown); the dubbed-title
  input (default `{title}_{LANG}`, e.g. `…_JA`); and the **segments table**
  — exactly Time | Original | Translation.
- **The money moment: double-click a Translation cell, edit, Enter.** Only
  the Translation column persists. If the language was already dubbed, the
  edit flips the Dub step to `rerun_needed`, which promotes `Re-Dub` to the
  primary action, which blocks Approve, which blocks the Frontify push —
  one keystroke re-arms the whole downstream chain. That gate is the
  product: the pipeline removed every human checkpoint except translation
  proofreading.
- Right: the VideoPanel — tabs **[Language] | Clean | Reference** (the
  first tab is the selected language's display name, e.g. "Japanese";
  localized is disabled until a dub exists), captions render only on the
  localized tab, plus **Download** (mp4 + vtt/srt/csv sidecars) and **Sync
  to Frontify**.
- Bottom: the Twick timeline drawer with per-language caption tracks.

**Dubbing engines.** Multi-speaker jobs route to the ElevenLabs Dubbing API
(voice-cloned, lip-sync-adjusted — audio may drift from the on-screen
translation); single-speaker defaults to TTS-first, which synthesizes the
exact approved segments and **re-renders the localized MP4 with Remotion**
(audio replacement, not lip-sync). One `dubs` row per (job, language).

**Frontify — two paths, only one uploads.** The real push is the
`push_frontify` STEP (VideoPanel's "Sync to Frontify" / project-level "Sync
All"): signed upload + `createAsset` titled `{title} - {lang} Dubbed`,
tagged, externalId `babylon:{jobId}:{lang}`, and auto-registered into the
Meta-ads analytics matcher. ⚠ The editor pipeline's "Send to Frontify"
entry calls `POST /api/frontify/push-dubs`, which is a **self-documented
placeholder** — it marks dubs pushed without uploading. Know which one a
surface is describing.

**Batches — two unrelated meanings.** "February Japan" is the Monday
hierarchy (board → group → item; target language regex-inferred from
group/item names). `Batch107` is a filename token
(`Talent.YYMMDD.Campaign.BatchN` parser) shown in the metadata card and the
UGC-naming CCP formula.

**Review surfaces.** Translation versions (`v{n}` + Version History sheet +
restore), shareable proofing links (`/s/script/{token}`, password-gateable),
a dub-review gallery with a bulk naming-convention builder, and `/app/
dubbings` ("all approved dubbed videos sent to Frontify").

---

## Heimdall — Studio PM

**What it is.** Connective workflow software for Loop's creative studio
(named for the Bifrost's guardian; deployed at a `bifrost` host). The
founding automation: design briefings live in Monday Docs, designers work
in Figma, and the copy-paste between them is now a webhook → Claude mapping
→ queue → Figma-plugin sync. Around that core it grew ops visibility,
feedback aggregation, competitive research and forecasting.

**Stack + scale.** Next.js 16 monorepo (app + `packages/figma-plugin` +
`packages/iterator-plugin` + design system), Supabase, **Vercel KV as the
job queue**, Claude (mapping runs on Opus with extended thinking), Gemini
(iterator images), Voyage embeddings + LlamaParse (document chat), three
daily crons (HiBob leave sync, trends, social comments).

**The flow — why the plugin exists.**

1. A Monday webhook (HMAC-verified) fires on status change; items must pass
   status + team eligibility.
2. The backend reads the Monday **Doc** (content, images, reference links)
   and maps it to a canonical `BriefingDTO`: experiment name, batch
   (`"MARCH 2026"` → `2026-03`), section (the Figma divider page), and
   variants A–D (product / visual messaging / headline / subline / bullets
   / CTA / note).
3. **Claude computes the node mapping** — Monday item + cached Figma
   template node tree + raw doc → `{ textMappings, frameRenames }` under a
   bundled mapping Skill, falling back to column-only mapping on failure.
4. **Everything queues.** The Figma REST API cannot create or duplicate
   pages (`serverWriteAvailable = false` is hardcoded), so jobs wait in
   Vercel KV with idempotency keys until a human runs the plugin.
5. **The designer opens the monthly file and runs Heimdall Sync** — the
   500×700 plugin panel: Sync Briefings | Export Comments tabs, a batch
   label like `APRIL 2026 (12)`, a checkbox list of items (rows already
   `populated` have DISABLED checkboxes — the idempotence guard), `Import
images`, and **`Sync {n} briefing(s)`** — the money moment; the whole
   architecture bends around the fact that this click cannot be automated
   away.
6. The plugin clones the template page ("Briefing Template to Duplicate"),
   applies the mapping to text nodes (ancestor-scoped keys like
   `Variation A::headline:`), renames frames, imports images (fetched by
   the UI iframe — the sandbox can't fetch), and inserts the page under its
   section divider. Asset frames are exact: 9:16 = 1440×2560, 4:5 =
   1440×1800, 1:1 = 1440×1440.
7. `/ops` tracks it all as a kanban: Upcoming → Ready for Figma → Imported
   → Exported to Frontify (plus a feedback-mode lane set).

**The second plugin.** Iterator — Create Iteration / Resize-Derive Formats
/ Generate from Briefing (the last is a UI skeleton pending backend);
Gemini-driven image variants with a placement reviewer.

**Integrations.** Monday (webhooks, docs, board reads), Figma (REST +
plugins), Frontify (asset linking, intake), HiBob (leave → Monday cron),
Meta Ad Library (four ingest modes), Exa/Perplexity (trends + social
digests), Voyage + LlamaParse (document chat), **Vesper** (image-generation
gateway), **Babylon** (HMAC-signed localization ingest bridge — the Figma
copy Babylon's Localization tool consumes).

**Gotchas.** The landing wireframe's BRIEFINGS · SYNC · TEMPLATE are
schematic labels, not product strings (the real ones: `#briefings-list`,
`Sync {n} briefing(s)`, "Briefing Template to Duplicate"). Mímir began
life as Heimdall's `/briefing-assistant` and spun out; Heimdall still
carries the routes and links to Mímir as an external tool.

---

## The bridges (one system, four tools)

- **Mímir → Monday → Heimdall → Figma**: a Studio briefing sent from Mímir
  becomes a Monday item + doc; Heimdall's webhook/queue turns it into a
  Figma page the plugin syncs.
- **Heimdall → Vesper**: Heimdall calls Vesper as its image-generation
  gateway (Nano Banana).
- **Heimdall → Babylon**: an HMAC-signed ingest bridge hands Figma copy to
  Babylon's Localization tool.
- **Babylon → Frontify → ads analytics**: pushed dubs register themselves
  for Meta-ads performance matching.
- **The Skill spine**: Vesper's enhancer and Claude.ai run the same
  `genai-prompting` Skill; Heimdall's node mapping runs its own bundled
  mapping Skill — encoded judgment shared between chat and product surfaces
  is the through-line the Proof section argues.
