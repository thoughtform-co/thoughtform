# Claude accounts on this machine (read 2026-10-12)

No secrets here. Keys are named, never copied.

## Profiles

Each CLI profile is a `CLAUDE_CONFIG_DIR`, opened by a launcher in
`C:\Users\buyss\.local\bin\` (`claude-profiles.json` lists them).

| Launcher                                           | Profile dir             | Signed in as         | Shares with `.claude`                                                   |
| -------------------------------------------------- | ----------------------- | -------------------- | ----------------------------------------------------------------------- |
| `claude-loop` (blanks the var) and the desktop app | `~\.claude`             | vince@thoughtform.co | is the source                                                           |
| `claude-tf`                                        | `~\.claude-thoughtform` | vince@thoughtform.co | projects, skills, plugins (junctions); identical settings and CLAUDE.md |
| `claude-starhaven`                                 | `~\.claude-starhaven`   | vince@starhaven.ai   | projects, skills, plugins (junctions); identical settings and CLAUDE.md |
| `claude-samako`                                    | `~\.claude-samako`      | vince@samako.nl      | nothing; client seat, denies reading the other profiles                 |
| `claude-suri`                                      | `~\.claude-suri`        | Suri org             | nothing; client seat, denies reading the other profiles                 |

Use **starhaven** (or tf) to continue this work. Samako and Suri are client
seats by design and must stay isolated.

## Memory

Auto-memory lives at
`~\.claude\projects\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\memory\`
and `projects` is a junction in both tf and starhaven, so they already read the
same 154 memories. Nothing to copy. A new profile gets it by making the same
junction (`New-Item -ItemType Junction <dir>\projects -Target ~\.claude\projects`).

## Per account, set up by hand

Settings (`settings.json`, the WoW hook, mods, plugins) are already identical
on tf and starhaven. What is NOT shared:

1. **MCP servers in `.claude.json`.** `.claude` has figma, skill-sync,
   substrate-vault, choam, **refero**; tf and starhaven lack **refero**. Add it
   if a task uses Refero.
2. **claude.ai connectors** (per account, enable in claude.ai Settings >
   Connectors): Figma (personal account buyssens.vincent@gmail.com for
   Thoughtform files), Notion, Gmail/Superhuman, Wispr Flow (meeting notes),
   Mobbin, Google Drive, Monday, Vercel, Supabase, Astrolabe.
3. **Plugin marketplace auth.** `thoughtform@thoughtform-plugins` comes from
   `github.com/thoughtform-co/thoughtform-plugins` (private): the account needs
   git access as `thoughtform-co`. Run `/plugin` once and update if skills like
   `thoughtform:cdaf` are missing.
4. **Login state.** `.credentials.json` is per profile; `/login` in one window
   moves every session on that profile (the account-lock mod warns).

## Keys (shared file, never copy it)

`C:\Users\buyss\Manifold Delta\Artifacts\Arcs_In The Pocket\projects\20260820-ai-readiness\skill\scripts\.env`
holds `GEMINI_API_KEY` (cdaf video reads, image generation), `OPENAI_API_KEY`,
`FIGMA_TOKEN`, `FIGMA_TOKEN_LOOP`, `REPLICATE_API_TOKEN`, `ELEVENLABS_API_KEY`
(empty). It is a file on disk, so every profile reads it. Worktrees also need
the repo's own `.env` and `.env.local` copied from the main checkout.

## GitHub

`gh` has three accounts: `thoughtform-co` (this repo), `tensalir`, `Samakosan`.
The harbour mod picks per remote; otherwise `gh auth switch --user thoughtform-co`.

## What does not carry over

The claude.ai project "Thoughtform Design": its threads, coordinator and
project memory belong to the account that owns it. The other account starts a
new project or works in the CLI; this folder replaces the thread history.
