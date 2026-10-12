# Project memory snapshot (2026-10-12 09:00Z)

Copied verbatim from the claude.ai project "Thoughtform Design", which does not
travel to another account. Verify anything stateful before relying on it.

# Thoughtform project (renamed "Thoughtform Design" 2026-10-11)
- Owner: Vince (GitHub thoughtform-co). Private project.
- Project topic: "Transform the Thoughtform inspirations and references into a scaleable brand system."
- Purpose: work across Thoughtform's core repos: the Thoughtform site/product, Armada, Astrolabe, and the Suri client arc.
- Repos: thoughtform-co/thoughtform, armada, Astrolabe, arcs-suri, thoughtform-plugins (the Thoughtform plugin his account loads everywhere).
- Context source: Google Drive folder "00_UI Moodboard" (UI design references).
- Devices: thoughtform checkout C:\Users\buyss\Manifold Delta\Artifacts\01_thoughtform; moodboard I:\My Drive\01_Thoughtform Branding\10_Websites\00_UI Moodboard. Code work on the site runs on his machine (his localhost, .env, local plans/videos).

## How Vince wants design work done
- Explore several iterations per section with stills and a recommendation, then discuss. Don't land on a final design unasked.
- When he picks a named variant and asks to port it, port THAT variant as-is. Never adapt, merge or swap in another. If it truly can't port as-is, ask first.
- Iterate from what already works on the site; don't invent new structures. A first study round was judged "an utter regression": new IA for case cards, stock-looking icons, text overlapping frames, oversized drawings, extra lines.
- For the core-proposition sections he wanted them built FROM SCRATCH, ignoring the thoughtform-design skill/MCP (they pull redesigns back to what exists), using frontend best practice and the references (Unsiloed and Tensorlake are the north stars). Complaints: fonts too small, text hugging dividers, stacked plates boring; wants retro-futuristic node/motherboard diagrams, not overcomplicated. No big documents; avoid context rot.
- Branch lab/xb-offer-rebuild started on another account (test page /test/xb-offer-rebuild, docs/plans/xb-offer-rebuild-handoff.md): "by far the most elegant integration", builds on the anatomy skill (github.com/wheresryan22/anatomy).
- Why earlier rounds failed: the repo's 149 KB CLAUDE.md, the global CLAUDE.md and memory load into every session, so the house grammar returns; sessions worked from summaries of the references instead of the references; measured type/spacing but not drawing quality; built inside the arc shell's stylesheets; too many variants stuffed with every fact. What worked: a self-contained folder importing nothing from arcs/landing, one isometric object, few words. Keep this root cause in every brief.
- Same failure on the job cards: each round built on the last round instead of the picked baseline, so drift compounded; card kept to one screen, so spacing shrank (crammed); too many words. The word "proof" loads .claude/rules/proof.md. Rules: diff against the picked baseline's still by eye; when content grows, let the card grow or cut words, never shrink spacing; lines/rails connect pixel-perfect (he notices 1px; measure).
- Implement every point of his note; he notices when one is skipped.
- Branch chore/context-cleanup (CLAUDE.md to a 5 KB index, rulings to sentinel/SURFACES.md, rule files path-scoped) unmerged, awaiting his yes.
- Longer goal: a scalable design system with a component library for agents; the substrate visual as an isometric diagram combining Unsiloed clarity with the Holo-inspired 3D instrument and the homepage motherboard.
- No bloom, "super slick". Leitmotif: particle-system / circuit-board isometric drawings (anatomy skill), minimal. Gold borders on cards are "really not beautiful"; small labels with Tensor Gold edges and text are fine.
- Check stills at 1280x720 and 1470x830 (he also views 1920 and 2560 wide), light and dark.
- References: unsiloed.ai, hex.inc/work/tensorlake, getcluster.ai, griffin.com, atomictessellator.com, augustus.com, lighthousehq.com; Mobbin MCP for spacing. References keep ~1200px width and get space from height and one-thing-at-a-time scroll.
- Section heads use the homepage services masthead (uppercase title, gold second line, gold cross mark), uniform.

## Multi-thread coordination on his checkout
- 3003 runs from the main checkout on lab/xb-offer-rebuild, owned by the "Proposition sections from scratch" thread. Other threads work in worktrees on their own branches and ports (job cards 3014 from C:/wtp, Loop 3012, network section 3016) and never edit that checkout or restart 3003. When a branch is ready, it gets merged into lab/xb-offer-rebuild so 3003 shows everything. Vince sometimes posts feedback in the wrong thread: route it to the owning thread. After merges, hard refresh.

## Video reads (cdaf)
- Skill thoughtform:cdaf lives in the Thoughtform plugin (thoughtform-plugins PR #7). Any repo asked to analyse a video checks for an existing .cdaf read first; new reads go beside the video and in that repo's docs/video-reads/. Runs on Gemini with his key. The site's six moodboard reads are in docs/video-reads/ on main.

## X-Bionic proposal (send date 2026-10-12)
- Goal: one narrative on the X-Bionic proposal page; it becomes the template for future proposals.
- State on lab/xb-offer-rebuild (3003, NOT main): centred H1 "AI capability your teams own." over the three-part flow ("01 · Embed in your team", "02 · Encode your context", "03 · Plug into Claude Enterprise"; Context/Skills/Evals labels with Tensor Gold edges and text; "Review posted" gold), then "EMBED, ENCODE, RUN." scroll section (sticky steps left, isometric plates right that stack at Run). Holo visual, adoption section, "The plugin, in your Claude Enterprise" and "What it returned at Loop" are hidden.
- Network section (branch claude/xb-network-plug, 3016, awaiting his pick): after Embed/Encode/Run the stack rotates to face the viewer and wires out to five workstreams; layouts Hub (recommended), Bus, Spine via ?net=.
- Job cards (branch claude/project-thread-qryydj, on 3003): top bar [CLIENT] + job + workstream icon; left ~55%: brief, gold rail with green Embed ("Mapped … with the <role>"), small gold Claude 1–3 under "Solve it together", a green tick off the rail into tool notes (no Scale frame or label); vertical rule; one visual right with corner crosses and grid; result as a soft Tensor Gold band under both panels. Gradient/border treatment under exploration on /test/proof-cards. Motion ad brief: Meta's algorithm rewards variety; motion ads convert but cost most to make. Briefs card visual is a Tensorlake-style flowchart. Files: components/arcs/ArcJob.tsx, job-stack.css, lib/arcs/content/shared/jobs.ts, lib/arcs/types.ts.
- Loop section (branch claude/project-thread-0nik5p, on 3003 as #practice): Augustus-style sticky section, not cards. Left sticks (workstream + glyph, title, one paragraph, four iconed achievements); right scrolls Loop's four visuals. Cards are for client cases; Loop is the build-up to the intelligence configuration. LOOP_RETURN is also drawn by Pandora's proposal, which must stay render-identical. Never "Time saved" on Loop; never $274.15, "ReCharm" or staff names.
- Rules: never first person on the page. No AI-slop copy (use thoughtform-tov). Sections must not all look the same. Nothing goes live on main (= thoughtform.co) without his explicit yes.
- Workstreams: Creative production (overarching; ads design sits within it), Creative ops, Creative review, Creative strategy, Creative technology.
- When a later note seems to conflict with an explicit brief, ask Vince.
- Plan on his machine: C:\Users\buyss\.claude\plans\i-my-drive-01-thoughtform-branding-10-w-ticklish-teacup.md.
