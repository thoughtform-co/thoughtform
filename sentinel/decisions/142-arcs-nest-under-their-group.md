# ADR-142: Every arc nests under its group

- **Status:** Proposed (2026-10-03, owner). Built and guarded; flips to Accepted once
  the owner has walked the new addresses live and the open items below are settled.
- **Surface:** every page under `/arcs/`. `lib/arcs/routes.ts` (new: `HOUSE_SLUG`,
  `groupOf`, `arcHref`, `groupHref`); `lib/arcs/legacyRoutes.mjs` (new, read by
  `next.config.mjs`); `ArcDef.leaf` (`lib/arcs/types.ts`, one per arc);
  `lib/arcs/clients.ts` (`AP_HOGESCHOOL_CLIENT`, `THOUGHTFORM_HOUSE`, `GROUPS`);
  `lib/arcs/registry.ts` (`getArcAt`, `arcHrefs`, `arcsOf` reads the house);
  `app/(marketing)/arcs/[slug]/page.tsx` (the group page only) and
  `app/(marketing)/arcs/[slug]/[leaf]/page.tsx` (new, the arc); the own-route folders
  moved to `thoughtform/workshop-v1`, `thoughtform/workshop-v2`,
  `ap-hogeschool/lecture`; `app/(marketing)/claude-workshop/` moved to
  `arcs/thoughtform/claude-workshop-corridor/`; `lib/sheet/arcs.ts`; `HERO_ROUTES`,
  `LIGHT_LOCKED_ROUTES`; the footer and the sitemap; `tests/lib/arcs-routes.test.ts` (new).
- **Reverses:** ADR-098 §2 ("the engagements stay flat").
- **Extends:** ADR-099's one nesting exception, which becomes the rule.

## The call

The owner, 2026-10-03: the Thoughtform workshops are "a bit floating around" next to
the clients, which already read as clusters on the overview. He asked for
`thoughtform.co/arcs/thoughtform/…` with `workshop-v1`, `workshop-v2` and the rest
beneath it, the Claude pages included, and then ruled three things when asked:

1. **All clients nest the same way**, not only the house: `/arcs/suri/proposal`, not
   `/arcs/suri-proposal`.
2. **AP Hogeschool is its own group**, `/arcs/ap-hogeschool/…`, not a house format.
3. **The May corridor page moves too**: `/claude-workshop` becomes
   `/arcs/thoughtform/claude-workshop-corridor`, link-only like every arc, out of the
   sitemap and the footer.

## The decision

**An arc's address is `/arcs/<group>/<leaf>`, and it is derived, never authored.**
The group is `arc.client`, or `thoughtform` for an arc with none. The leaf is a new
required field, `ArcDef.leaf`. `/arcs/<group>` is the group's own page, the listing it
always was for a client and now is for the house too. Every link to an arc, on the
overview, a group page or another arc, goes through `arcHref`.

**The slug stays, as the arc's id.** It is what `getArc`, the overview's element ids,
`OWN_ROUTE_SLUGS` and a hundred test pins key on, and renaming it would have bought
nothing the address did not already give. The one id that changed is the lecture's,
`ap-hogeschool` to `ap-hogeschool-lecture`, because the school took that slug as a
client, and client and arc ids share the overview's element ids.

**The house is a group, never a client.** `THOUGHTFORM_HOUSE` is a `ClientDef` outside
`CLIENTS`; `GROUPS` adds it for the routes and the listings. The house's arcs carry no
`client`, the overview still draws them as house formats in their own lanes, and
nothing that counts clients counts the house. Its listing differs from a client's in
three letterings and one order: the head says `House formats`, the console `// House`
(a flag on the panel, never the string, by the sheet's chrome rule), the page is titled
`House formats — Thoughtform`, and its cards lead with the formats, the archetype
first, with its one non-arc page, the corridor variant, last. `Latest` on every
console is now the newest filing by date, which was what "the first card" meant for
every client until the house listed an archetype ahead of its newer cuts.

**Every old address forwards, in one hop.** `lib/arcs/legacyRoutes.mjs` lists each
flat address with its page today, and `next.config.mjs` serves them as 308s. ADR-098
§2 kept the engagements flat because their links are in inboxes; the redirects keep
that promise without the flat namespace. `/arcs/portfolio`, the Loop arc's first slug,
now points straight at `/arcs/loop/portfolio` instead of chaining through
`/arcs/loop-earplugs`.

| Was                                    | Is                                                                   |
| -------------------------------------- | -------------------------------------------------------------------- |
| `/arcs/thoughtform-workshop`           | `/arcs/thoughtform/workshop-v1`                                      |
| `/arcs/thoughtform-workshop-v2`        | `/arcs/thoughtform/workshop-v2`                                      |
| `/arcs/claude-workshop`, `-v2`         | `/arcs/thoughtform/claude-workshop-v1`, `-v2`                        |
| `/arcs/ai-keynote`, `-v2`              | `/arcs/thoughtform/keynote-v1`, `-v2`                                |
| `/arcs/ai-storytelling`, `-class-1`    | `/arcs/thoughtform/ai-storytelling`, `-class-1`                      |
| `/claude-workshop`                     | `/arcs/thoughtform/claude-workshop-corridor`                         |
| `/arcs/ap-hogeschool`                  | `/arcs/ap-hogeschool/lecture` (the old address is the school's page) |
| `/arcs/<client>-proposal`, `-workshop` | `/arcs/<client>/proposal`, `/workshop`                               |
| `/arcs/loop-earplugs`                  | `/arcs/loop/portfolio`                                               |

⚠ **`/arcs/ap-hogeschool` IS THE ONE OLD ADDRESS THAT DOES NOT REDIRECT.** It was the
lecture and is now the school's own page, which lists the lecture as its one card. A
redirect would hide that page, so a reader holding the old link is one click from the
lecture rather than on it.

⚠ **A GROUP'S FOLDER DOES NOT SHADOW ITS LISTING.** `thoughtform/`, `ap-hogeschool/`
and `trinny-london/` are real folders holding pages one level down. None renders a page
of its own, so `/arcs/<group>` still resolves to `[slug]`: the router matches whole
paths, never a folder first. The folder walk in `thoughtform-workshop-v2.test.ts` fails
a group folder that grows a `page.tsx`.

⚠ **THE PASSWORD KEY FOLLOWS THE ADDRESS** (ADR-135: the path's segments, joined). For a
client's proposal or workshop the key is unchanged, `/arcs/pandora/proposal` is still
`PANDORA_PROPOSAL`, so a page password and a reader's pass cookie both survive. For the
others it moves: `LOOP_EARPLUGS` → `LOOP_PORTFOLIO`, `THOUGHTFORM_WORKSHOP` →
`THOUGHTFORM_WORKSHOP_V1`, `AP_HOGESCHOOL` → `AP_HOGESCHOOL_LECTURE`, every other house
format gains a `THOUGHTFORM_` prefix, and `/claude-workshop`, never gated, would now
fall under `ARCS_PASSWORD` if one were set.

## Guards

- `tests/lib/arcs-routes.test.ts` (new): every arc one address, unique, under a group
  that has a page; the house a group and never a client; a group's non-arc page two
  segments under its own group; every redirect one hop to a live page and never from
  one; every address the site ever handed out, pinned by hand, still answering.
- `thoughtform-workshop-v2.test.ts`: the own-route walk is two levels deep. A folder
  that renders a page is an arc filtered out of `[slug]/[leaf]` by its id, or a
  group's `pages` record; never neither, and never a page at the group's own level.
- `sheet-arcs`, `arcs-registry`, `hero-preload`, `theme-lock`, `sheet-config-fit` and
  the overview smokes read addresses through `arcHref`, never `/arcs/${slug}`.

## Open items

- **Vercel environment: nothing to rename.** Read 2026-10-03 (names only): the one page
  password is `ARC_PASSWORD_PANDORA_PROPOSAL`, whose key is unchanged, and no
  `ARCS_PASSWORD` is set, so every other arc, the corridor page now included, stays open
  by link. A page password added later uses the key of its address today.
- **The corridor page's date** on the overview is ADR-053's, 2026-07-27,
  owner-to-confirm (the route itself dates from 2026-05-19).
- **The house's lede and `since` (2025)** are drafts in the copy law's register.
