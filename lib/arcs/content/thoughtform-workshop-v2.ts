import type { ArcDef, ArcSection } from "../types";

import { FRONTIER_CURVE } from "./shared/frontierCurve";
import { WRITING_BENCH } from "./shared/writingBench";
import { HAND_IT_TO_AN_AGENT } from "./shared/handItToAnAgent";
import { MARKET_SIGNAL_COLUMNS } from "./shared/marketSignal";
import { THREE_WAYS_LOOP } from "./shared/threeWaysLoop";
import { TOOL_AND_COLLABORATOR } from "./shared/toolAndCollaborator";
import { whatFollows } from "./shared/whatFollows";
import { FEEDBACK_STEPS, getStarted, theHorizon } from "./shared/workshopPractice";

/**
 * The Thoughtform workshop, SECOND CUT (ADR-139).
 *
 * v1 is the archetype the client forks were cut from, and it stays exactly
 * as it is. This is the cut the practice runs next: the same corridor, the
 * same framing, and a practical half that shows the configuration actually
 * built instead of a ladder of things to try.
 *
 * ⚠ WHAT CHANGED, AND WHY. v1's hands-on chapter was the Plopsa morning's
 * ladder — one image, a brief, formats, motion, make it a skill. It works in
 * a room with a machine in front of every person. It says nothing to a room
 * asking the question that actually blocks them, which is: we understand the
 * six questions, so where does any of it LIVE? This cut answers that, beat
 * by beat: the plugin board, the skill as the file it is, the marketplace,
 * the two conversations, and one bench all the way down.
 *
 * ⚠ THE FRAMING IS v1's, RENUMBERED. Every beat from the opening board to
 * the signal is the archetype's own copy, carried across rather than shared
 * by reference, because `ground` is inserted at 04 and every eyebrow after
 * it shifts. The one record that IS shared is the frontier curve, which the
 * registry pins by reference on both pages, and the writing bench, hoisted
 * for the same reason when this cut turned out to need it too.
 *
 * ⚠ THE GROUND IS NEW (owner, 2026-09-30). It sits where the argument needs
 * it: the curve says each release finishes longer work, and the beat after
 * it says what follows — a general model got good enough at enough things
 * that a shelf of single-purpose platforms stopped earning its keep. It is
 * the question every room asks and no previous cut answered.
 *
 * ⚠ THE PRACTICAL HALF IS THE PRACTICE'S OWN WORK, THREE WAYS (ADR-131's
 * law, held). A base fork may not carry a client's evidence, so the three
 * worked examples are three house Skills that exist on disk — the voice, the
 * fleet's rubric, the reference decoder — and every file, rule and stop
 * drawn on this page is quoted from one of them, shortened, never invented.
 * A fork swaps the examples and keeps the shape.
 *
 * ⚠ THE SWITCH IS PAGE-WIDE AND THE BENCH IS NOT IN IT. Five beats carry
 * three panels each; the bench carries one, because the writing Skill is the
 * only one of the three whose evals are written down today. Showing three
 * benches would mean inventing two sets of checks, and a page that teaches a
 * room what an eval is cannot open by making some up. It closes the chapter
 * instead: one of them, all the way down.
 *
 * ⚠ ONE IDEA PER VIEWPORT, and the practice's own published law: exactly one
 * picture per section, a beat is a section with no picture, each section
 * fills one screen at 1280x720 and never scrolls. A sentence that does not
 * fit is a sentence to CUT, never a column to widen.
 */

/** The three worked examples, in the order every switched beat carries them.
 *  ⚠ THE SAME IDS AND LABELS IN EVERY GROUP — the pick is page-wide, and the
 *  registry pins the tuples equal so one choice is valid for all of them. */
const WORKED = {
  voice: { id: "voice", label: "Words" },
  image: { id: "image", label: "Pictures" },
  reference: { id: "reference", label: "References" },
} as const;

/** A switched beat's panel stamp. The group is the beat; the panels of one
 *  beat must be contiguous, which the registry walks. */
const panel = (group: string, which: keyof typeof WORKED) => ({
  group,
  id: WORKED[which].id,
  label: WORKED[which].label,
});

/* ── 13 · The configuration, made real ──────────────────────────────── */

const MADE_REAL: ArcSection[] = [
  {
    id: "made-real-voice",
    kind: "plugin-board",
    menuLabel: "Made real",
    menuPrimary: true,
    worked: panel("made-real", "voice"),
    head: {
      eyebrow: "14 · Made real",
      title: { pre: "Every answer has somewhere to live.", em: "Together they make a plugin." },
      sub: "What the team knows becomes a skill, and what good looks like becomes its evals. The plugin is where those two sit with the connectors and the owner, so the whole answer travels as one thing.",
    },
    above: [
      {
        id: "market",
        name: "The marketplace",
        line: "Where the plugin is kept, and where updates come from",
      },
      {
        id: "account",
        name: "The account",
        line: "Connected once. It sets the model everything here runs on",
        answers: "the model",
      },
    ],
    plugin: { label: "The plugin", name: "Thoughtform Words" },
    parts: [
      {
        id: "skill",
        name: "The skill",
        line: "thoughtform-tov: the voice, the phrasebook, the hard bans",
        answers: "the context",
        lit: true,
      },
      {
        id: "evals",
        name: "Its evals",
        line: "Posts that went out, and posts that came back",
        answers: "the evaluations",
        lit: true,
      },
      {
        id: "connectors",
        name: "The connectors",
        line: "The site's own drafts, read only",
        answers: "the data",
      },
      {
        id: "owner",
        name: "The owner",
        line: "A name and an address. They answer for what it does",
        answers: "the owner",
      },
    ],
    centre: {
      kicker: "In every plugin",
      name: "The mother",
      line: "Reads each skill's work against what the others learned",
    },
    bar: { line: "Chat, desktop, Cowork, Claude Code", answers: "the interface" },
    alt: "A plugin drawn as a frame around four plates, the skill and its evals lit, a marketplace and an account above it and the interfaces on a bar beneath",
  },
  {
    id: "made-real-image",
    kind: "plugin-board",
    worked: panel("made-real", "image"),
    head: {
      eyebrow: "14 · Made real",
      title: { pre: "Every answer has somewhere to live.", em: "Together they are a plugin." },
      sub: "What the team knows becomes a skill, and what good looks like becomes its evals. The plugin is where those two sit with the connectors and the owner, so the whole answer travels as one thing.",
    },
    above: [
      {
        id: "market",
        name: "The marketplace",
        line: "The repository the plugin is kept in, and updated from",
      },
      {
        id: "account",
        name: "The account",
        line: "Connected once. The image models are reached by key",
        answers: "the model",
      },
    ],
    plugin: { label: "The plugin", name: "Thoughtform Imagery" },
    parts: [
      {
        id: "skill",
        name: "The skill",
        line: "armada: the rubric, the anchors, the repair clause",
        answers: "the context",
        lit: true,
      },
      {
        id: "evals",
        name: "Its evals",
        line: "Frames that shipped, and frames that were sent back",
        answers: "the evaluations",
        lit: true,
      },
      {
        id: "connectors",
        name: "The connectors",
        line: "The image models by key, and the gallery",
        answers: "the data",
      },
      {
        id: "owner",
        name: "The owner",
        line: "A name and an address. They are the last gate on a wave",
        answers: "the owner",
      },
    ],
    centre: {
      kicker: "In every plugin",
      name: "The mother",
      line: "Reads each skill's work against what the others learned",
    },
    bar: { line: "Chat, desktop, Cowork, Claude Code", answers: "the interface" },
    alt: "The same plugin frame, this time around the imagery skill and the rubric it grades against",
  },
  {
    id: "made-real-reference",
    kind: "plugin-board",
    worked: panel("made-real", "reference"),
    head: {
      eyebrow: "14 · Made real",
      title: { pre: "Every answer has somewhere to live.", em: "Together they are a plugin." },
      sub: "What the team knows becomes a skill, and what good looks like becomes its evals. The plugin is where those two sit with the connectors and the owner, so the whole answer travels as one thing.",
    },
    above: [
      {
        id: "market",
        name: "The marketplace",
        line: "The repository the plugin is kept in, and updated from",
      },
      {
        id: "account",
        name: "The account",
        line: "Connected once. It sets the model everything here runs on",
        answers: "the model",
      },
    ],
    plugin: { label: "The plugin", name: "Thoughtform Reference" },
    parts: [
      {
        id: "skill",
        name: "The skill",
        line: "reference-decoder: what to read off a frame, in order",
        answers: "the context",
        lit: true,
      },
      {
        id: "evals",
        name: "Its evals",
        line: "Decodes that transferred, and decodes that did not",
        answers: "the evaluations",
        lit: true,
      },
      {
        id: "connectors",
        name: "The connectors",
        line: "The board, and the frames pinned on it",
        answers: "the data",
      },
      {
        id: "owner",
        name: "The owner",
        line: "A name and an address. They answer for what it does",
        answers: "the owner",
      },
    ],
    centre: {
      kicker: "In every plugin",
      name: "The mother",
      line: "Reads each skill's work against what the others learned",
    },
    bar: { line: "Chat, desktop, Cowork, Claude Code", answers: "the interface" },
    alt: "The same plugin frame, this time around the reference decoder and the decodes it is measured on",
  },
];

/* ── 14 · A skill, as the file it is ─────────────────────────────────
   ⚠ EVERY LINE IS QUOTED FROM THE REAL SKILL, SHORTENED. The three files
   are on disk in the practice's own plugin; nothing here is written for the
   page. */

const THE_SKILL: ArcSection[] = [
  {
    id: "the-skill-voice",
    kind: "skill-file",
    menuLabel: "A skill",
    worked: panel("the-skill", "voice"),
    badge: "Claude · Skill",
    head: {
      eyebrow: "15 · A skill",
      title: { pre: "A skill is how you work,", em: "written down." },
      sub: "The first thing the team writes: what it knows. It is a folder with one main file, in plain language, and Claude reaches for it when the request fits. This is a real one, shortened.",
    },
    path: "thoughtform-tov / SKILL.md",
    where: "in Thoughtform Words",
    lines: [
      { id: "fm-open", as: "meta", text: "---" },
      { id: "name", as: "meta", key: "name", text: "thoughtform-tov" },
      {
        id: "desc",
        as: "meta",
        key: "description",
        text: "Writes and repairs everything published under Vince Buyssens' name (Thoughtform), in Flemish Dutch and English. Use whenever he asks to write, draft, tighten, rewrite or check text; whenever a draft from any agent must sound like a person.",
        mark: 1,
      },
      { id: "fm-close", as: "meta", text: "---" },
      { id: "h1", as: "h1", text: "Thoughtform tone of voice" },
      {
        id: "lede",
        as: "body",
        text: "Two jobs live here, they look alike, and treating them as one is the mistake this skill exists to stop.",
      },
      { id: "h2a", as: "h2", text: "The law" },
      { id: "rule", as: "rule", text: "You cannot style your way out of a dialect.", mark: 2 },
      {
        id: "why",
        as: "body",
        text: "Applying a tone of voice to AI-drafted text produces slop with a Flemish accent. The vocabulary changes and the structure survives.",
      },
      { id: "h2b", as: "h2", text: "The NEEDS protocol, a hard rule" },
      {
        id: "stop",
        as: "body",
        text: "The skill never invents a particular. When the brief lacks the one a paragraph needs, the draft leaves a visible slot and moves on.",
        mark: 3,
      },
    ],
    notes: [
      {
        id: "when",
        n: 1,
        title: "When Claude reaches for it",
        body: "Claude reads this one line for every skill you have and matches your request against it. Say tighten this, and this skill starts. Nothing else on the page matters if this line is vague.",
      },
      {
        id: "how",
        n: 2,
        title: "The craft, written once",
        body: "The rule the whole skill turns on, in the file rather than in somebody's head. Written once, and every draft after it is read against the same thing.",
      },
      {
        id: "stop",
        n: 3,
        title: "Where it stops and asks",
        body: "Rather than inventing a number to make a sentence land, it leaves a slot and names what it needs. A skill that cannot say it does not know is a skill that makes things up.",
      },
    ],
    folder: {
      label: "In the same folder",
      items: [
        "references/, thirteen of them",
        "examples/, real before and after",
        "evals/RUBRIC.md, its tests",
        "CHANGELOG.md",
      ],
    },
  },
  {
    id: "the-skill-image",
    kind: "skill-file",
    worked: panel("the-skill", "image"),
    badge: "Claude · Skill",
    head: {
      eyebrow: "15 · A skill",
      title: { pre: "A skill is how you work,", em: "written down." },
      sub: "The first thing the team writes: what it knows. It is a folder with one main file, in plain language, and Claude reaches for it when the request fits. This is a real one, shortened.",
    },
    path: "armada / SKILL.md",
    where: "in Thoughtform Imagery",
    lines: [
      { id: "fm-open", as: "meta", text: "---" },
      { id: "name", as: "meta", key: "name", text: "armada" },
      {
        id: "desc",
        as: "meta",
        key: "description",
        text: "Turns a brand's real subjects into imagery at volume: waves under a rubric, graded three times, contact-sheeted, picked, reviewed in a gallery, the person as the last gate. Use for writing or repairing a rubric, running or grading a wave.",
        mark: 1,
      },
      { id: "fm-close", as: "meta", text: "---" },
      { id: "h1", as: "h1", text: "Armada" },
      {
        id: "lede",
        as: "body",
        text: "Each client engagement is a ship. It carries the same harness, learns its own waters, and comes home to report.",
      },
      { id: "h2a", as: "h2", text: "Grading" },
      {
        id: "rule",
        as: "rule",
        text: "Never trust a single grade. Three runs, majority per check, ties fail.",
        mark: 2,
      },
      {
        id: "why",
        as: "body",
        text: "Measured: one grade moves the verdict on a quarter of a wave between runs. Never compare arms, prompts or models on single-shot grades.",
      },
      { id: "h2b", as: "h2", text: "The last gate" },
      {
        id: "stop",
        as: "body",
        text: "The person stays the last gate on every ship. A grade is advisory until the rubric says otherwise.",
        mark: 3,
      },
    ],
    notes: [
      {
        id: "when",
        n: 1,
        title: "When Claude reaches for it",
        body: "Claude reads this one line for every skill you have and matches your request against it. Ask for a wave to be graded, and this skill starts. Nothing else on the page matters if this line is vague.",
      },
      {
        id: "how",
        n: 2,
        title: "The craft, written once",
        body: "A rule that came out of measuring the thing rather than assuming it, so nobody has to rediscover it. Written once, and every wave after it is graded the same way.",
      },
      {
        id: "stop",
        n: 3,
        title: "Where it stops and asks",
        body: "It grades, and it stops. Choosing which frames go out stays with the person whose name is on them, and the skill says so in its own file.",
      },
    ],
    folder: {
      label: "In the same folder",
      items: [
        "references/, nine of them",
        "the rubric, per client, on the ship",
        "the harness the ships share",
      ],
    },
  },
  {
    id: "the-skill-reference",
    kind: "skill-file",
    worked: panel("the-skill", "reference"),
    badge: "Claude · Skill",
    head: {
      eyebrow: "15 · A skill",
      title: { pre: "A skill is how you work,", em: "written down." },
      sub: "The first thing the team writes: what it knows. It is a folder with one main file, in plain language, and Claude reaches for it when the request fits. This is a real one, shortened.",
    },
    path: "reference-decoder / SKILL.md",
    where: "in Thoughtform Reference",
    lines: [
      { id: "fm-open", as: "meta", text: "---" },
      { id: "name", as: "meta", key: "name", text: "reference-decoder" },
      {
        id: "desc",
        as: "meta",
        key: "description",
        text: "Makes a reference image's look transferable. Use when a style reference is attached and the output does not match it, when a look lands on one image in a set and not the rest, or when generated light reads as a wash rather than a lamp.",
        mark: 1,
      },
      { id: "fm-close", as: "meta", text: "---" },
      { id: "h1", as: "h1", text: "Reference decoder" },
      {
        id: "lede",
        as: "body",
        text: "A style reference does not transfer a look. It transfers statistics, because statistics are all a picture can carry on its own.",
      },
      { id: "h2a", as: "h2", text: "Decoding" },
      { id: "rule", as: "rule", text: "State the fixture, never the falloff.", mark: 2 },
      {
        id: "why",
        as: "body",
        text: "A bare undiffused unit at waist height, three metres camera-right, is a cause. The lower body reads saturated orange-red is an effect, and the model will paint it flat, as a gradient.",
      },
      { id: "h2b", as: "h2", text: "Reading a result" },
      {
        id: "stop",
        as: "body",
        text: "Treat the single-run output as a draft, never as a measurement. Never report a chained result as an identity pass.",
        mark: 3,
      },
    ],
    notes: [
      {
        id: "when",
        n: 1,
        title: "When Claude reaches for it",
        body: "Claude reads this one line for every skill you have and matches your request against it. Say the reference is not being applied, and this skill starts. Nothing else matters if this line is vague.",
      },
      {
        id: "how",
        n: 2,
        title: "The craft, written once",
        body: "The whole method in six words, with the reason under it. It is the sentence a new person on the team would otherwise take a month of bad frames to arrive at.",
      },
      {
        id: "stop",
        n: 3,
        title: "Where it stops and asks",
        body: "It refuses to call one run a measurement. The skill knows the difference between a result and evidence, which is the difference the room is here to learn.",
      },
    ],
    folder: {
      label: "In the same folder",
      items: ["references/, and a calibration run", "scripts/decode.py", "scripts/lightfield.py"],
    },
  },
];

/* ── 15 · The plugin and the marketplace ─────────────────────────────── */

const THE_PLUGIN: ArcSection[] = [
  {
    id: "the-plugin-voice",
    kind: "list-groups",
    menuLabel: "The plugin",
    worked: panel("the-plugin", "voice"),
    layout: "readout",
    head: {
      eyebrow: "16 · How it reaches the team",
      title: { pre: "One install for the team,", em: "from a shelf that stays current." },
      sub: "The team's skills are packed into one plugin, and the plugin sits on a shelf your organisation owns. The shelf is added once; after that a new skill arrives without anybody being asked to install anything.",
    },
    groups: [
      {
        id: "plugin",
        label: "The plugin",
        blurb: "what you get",
        items: [
          { id: "manifest", tag: "plugin.json", name: "Its name in Claude, and its version" },
          { id: "skills", tag: "skills/", name: "One folder per skill" },
          { id: "mother", tag: "mother/", name: "Reads the work, in every plugin" },
          { id: "tov", tag: "thoughtform-tov/", name: "The skill you just read" },
          { id: "musings", tag: "musings/", name: "The long form, and its shape" },
          { id: "evals", tag: "evals/", name: "Tests for the plugin as a whole" },
        ],
        foot: {
          label: "What it means",
          lines: [
            "One install for everyone who writes.",
            "It updates itself when a change is merged.",
          ],
        },
      },
      {
        id: "marketplace",
        label: "The marketplace",
        blurb: "where it comes from",
        items: [
          { id: "words", tag: "Plugin", name: "Thoughtform Words" },
          { id: "imagery", tag: "Plugin", name: "Thoughtform Imagery" },
          { id: "reference", tag: "Plugin", name: "Thoughtform Reference" },
          { id: "repo", tag: "Kept in", name: "One repository, on GitHub" },
        ],
        foot: {
          label: "Who decides",
          lines: [
            "Every team's plugin is offered from the same shelf.",
            "A person merges each change. Nothing ships before that.",
          ],
        },
      },
    ],
  },
  {
    id: "the-plugin-image",
    kind: "list-groups",
    worked: panel("the-plugin", "image"),
    layout: "readout",
    head: {
      eyebrow: "16 · What you get",
      title: { pre: "One plugin,", em: "from one shelf." },
      sub: "The team's skills are packed into one plugin, and the plugin sits in a marketplace that keeps itself in sync. The marketplace is the shelf; the plugin is the book you take off it.",
    },
    groups: [
      {
        id: "plugin",
        label: "The plugin",
        blurb: "what you get",
        items: [
          { id: "manifest", tag: "plugin.json", name: "Its name in Claude, and its version" },
          { id: "skills", tag: "skills/", name: "One folder per skill" },
          { id: "mother", tag: "mother/", name: "Reads the work, in every plugin" },
          { id: "armada", tag: "armada/", name: "The skill you just read" },
          { id: "prompting", tag: "genai-prompting/", name: "Prompt craft for the models" },
          { id: "evals", tag: "evals/", name: "Tests for the plugin as a whole" },
        ],
        foot: {
          label: "What it means",
          lines: [
            "One install for everyone who makes pictures.",
            "It updates itself when a change is merged.",
          ],
        },
      },
      {
        id: "marketplace",
        label: "The marketplace",
        blurb: "where it comes from",
        items: [
          { id: "words", tag: "Plugin", name: "Thoughtform Words" },
          { id: "imagery", tag: "Plugin", name: "Thoughtform Imagery" },
          { id: "reference", tag: "Plugin", name: "Thoughtform Reference" },
          { id: "repo", tag: "Kept in", name: "One repository, on GitHub" },
        ],
        foot: {
          label: "Who decides",
          lines: [
            "Every team's plugin is offered from the same shelf.",
            "A person merges each change. Nothing ships before that.",
          ],
        },
      },
    ],
  },
  {
    id: "the-plugin-reference",
    kind: "list-groups",
    worked: panel("the-plugin", "reference"),
    layout: "readout",
    head: {
      eyebrow: "16 · What you get",
      title: { pre: "One plugin,", em: "from one shelf." },
      sub: "The team's skills are packed into one plugin, and the plugin sits in a marketplace that keeps itself in sync. The marketplace is the shelf; the plugin is the book you take off it.",
    },
    groups: [
      {
        id: "plugin",
        label: "The plugin",
        blurb: "what you get",
        items: [
          { id: "manifest", tag: "plugin.json", name: "Its name in Claude, and its version" },
          { id: "skills", tag: "skills/", name: "One folder per skill" },
          { id: "mother", tag: "mother/", name: "Reads the work, in every plugin" },
          { id: "decoder", tag: "reference-decoder/", name: "The skill you just read" },
          { id: "interface", tag: "interface-decoder/", name: "The same method, for screens" },
          { id: "evals", tag: "evals/", name: "Tests for the plugin as a whole" },
        ],
        foot: {
          label: "What it means",
          lines: [
            "One install for everyone who decodes a look.",
            "It updates itself when a change is merged.",
          ],
        },
      },
      {
        id: "marketplace",
        label: "The marketplace",
        blurb: "where it comes from",
        items: [
          { id: "words", tag: "Plugin", name: "Thoughtform Words" },
          { id: "imagery", tag: "Plugin", name: "Thoughtform Imagery" },
          { id: "reference", tag: "Plugin", name: "Thoughtform Reference" },
          { id: "repo", tag: "Kept in", name: "One repository, on GitHub" },
        ],
        foot: {
          label: "Who decides",
          lines: [
            "Every team's plugin is offered from the same shelf.",
            "A person merges each change. Nothing ships before that.",
          ],
        },
      },
    ],
  },
];

/* ── 16 · Using it ───────────────────────────────────────────────────── */

const MENU_ITEMS = [
  { id: "tov", name: "thoughtform-tov", from: "Words" },
  { id: "musings", name: "musings", from: "Words" },
  { id: "armada", name: "armada", from: "Imagery" },
  { id: "prompting", name: "genai-prompting", from: "Imagery" },
  { id: "decoder", name: "reference-decoder", from: "Reference" },
] as const;

const menuWith = (on: string) => ({
  kind: "menu" as const,
  label: "Or pick it yourself",
  title: "Skills, and the plugin each came from",
  items: MENU_ITEMS.map((item) => (item.id === on ? { ...item, on: true as const } : item)),
});

const USING_IT: ArcSection[] = [
  {
    id: "using-it-voice",
    kind: "chat",
    menuLabel: "Using it",
    worked: panel("using-it", "voice"),
    variant: "ask",
    head: {
      eyebrow: "17 · Using it",
      title: { pre: "Ask in your own words.", em: "Or type a slash and pick." },
      sub: "Claude matches the request to the right skill and says which one it used. Nobody has to remember what is installed, or what it is called.",
    },
    thread: {
      title: "A post about the workshop",
      turns: [
        {
          kind: "you",
          id: "ask",
          text: "Tighten this into a post. It is a brain dump from the train.",
        },
        { kind: "tool", id: "tool", text: "Using thoughtform-tov" },
        {
          kind: "claude",
          id: "answer",
          blocks: [
            {
              kind: "p",
              text: "Cut to one idea and took the staged contrast out of the opening. Three things need you before it goes anywhere:",
            },
            {
              kind: "list",
              items: [
                "NEEDS: which month the workshop ran",
                "NEEDS: how many people were in the room",
                "NEEDS: confirm the claim about the second run",
              ],
            },
            {
              kind: "p",
              text: "The last one is a synthesis you have not made yourself, so it is a slot rather than a sentence. Fill those and it ships.",
            },
          ],
        },
      ],
      composer: "Write a message",
    },
    aside: menuWith("tov"),
  },
  {
    id: "using-it-image",
    kind: "chat",
    worked: panel("using-it", "image"),
    variant: "ask",
    head: {
      eyebrow: "17 · Using it",
      title: { pre: "Ask in your own words.", em: "Or type a slash and pick." },
      sub: "Claude matches the request to the right skill and says which one it used. Nobody has to remember what is installed, or what it is called.",
    },
    thread: {
      title: "The new wave",
      turns: [
        {
          kind: "you",
          id: "ask",
          text: "Grade the wave that came in overnight and show me the sheet.",
        },
        { kind: "tool", id: "tool", text: "Using armada" },
        {
          kind: "claude",
          id: "answer",
          blocks: [
            { kind: "p", text: "Graded three times, majority per check. On the sheet:" },
            {
              kind: "rows",
              rows: [
                { term: "Clean", def: "Eleven of sixteen, on every check" },
                { term: "Ties", def: "Two, and a tie fails" },
                { term: "Unstable", def: "Three moved verdict between runs" },
              ],
            },
            {
              kind: "p",
              text: "The three unstable ones are named on the sheet rather than scored. You pick what goes out.",
            },
          ],
        },
      ],
      composer: "Write a message",
    },
    aside: menuWith("armada"),
  },
  {
    id: "using-it-reference",
    kind: "chat",
    worked: panel("using-it", "reference"),
    variant: "ask",
    head: {
      eyebrow: "17 · Using it",
      title: { pre: "Ask in your own words.", em: "Or type a slash and pick." },
      sub: "Claude matches the request to the right skill and says which one it used. Nobody has to remember what is installed, or what it is called.",
    },
    thread: {
      title: "The look will not transfer",
      turns: [
        {
          kind: "you",
          id: "ask",
          text: "This reference works on one frame and nowhere else. Why?",
        },
        { kind: "tool", id: "tool", text: "Using reference-decoder" },
        {
          kind: "claude",
          id: "answer",
          blocks: [
            {
              kind: "p",
              text: "The reference is carrying statistics, not a lamp. Decoded, what made the original good is:",
            },
            {
              kind: "rows",
              rows: [
                { term: "Fixture", def: "A bare unit at waist height, camera left" },
                { term: "Falloff", def: "Steep, so the far cheek goes to nothing" },
                { term: "Leak", def: "The coat is coming across with it" },
              ],
            },
            {
              kind: "p",
              text: "Written as a specification it transfers. As a picture it will keep being satisfied the cheapest way.",
            },
          ],
        },
      ],
      composer: "Write a message",
    },
    aside: menuWith("decoder"),
  },
];

/* ── 17 · When it is wrong ───────────────────────────────────────────── */

/* The four steps after `/skill-feedback` are a SHARED RECORD since ADR-143
   (`shared/workshopPractice.ts`): the third house cut shows them too. */

const WHEN_WRONG: ArcSection[] = [
  {
    id: "when-wrong-voice",
    kind: "chat",
    menuLabel: "When it is wrong",
    worked: panel("when-wrong", "voice"),
    variant: "feedback",
    head: {
      eyebrow: "18 · When it is wrong",
      title: { pre: "When a skill gets it wrong,", em: "say so in the chat." },
      sub: "Say what went wrong where you are already working. You see exactly what will be filed before anything is filed, and nothing goes anywhere until you say yes.",
    },
    thread: {
      title: "A post about the workshop",
      turns: [
        {
          kind: "you",
          id: "say",
          slash: "/skill-feedback",
          text: "It invented a number for the room size instead of leaving a slot.",
        },
        { kind: "tool", id: "tool", text: "Reading the skill, and what is already open" },
        {
          kind: "claude",
          id: "confirm",
          blocks: [
            {
              kind: "p",
              text: "That goes to the owner of thoughtform-tov, and someone raised something similar, so your words can join theirs. Exactly what I would file:",
            },
            {
              kind: "issue",
              title: "thoughtform-tov: a particular invented, not slotted",
              rows: [
                { term: "What", def: "A room size written as fact, with no source" },
                { term: "Where", def: "Thoughtform Words, thoughtform-tov" },
                { term: "Rule", def: "The NEEDS protocol says leave a slot" },
              ],
            },
            { kind: "p", text: "Shall I file it?" },
          ],
        },
        { kind: "you", id: "yes", text: "Yes, add mine to theirs." },
      ],
      composer: "Write a message",
    },
    aside: FEEDBACK_STEPS,
  },
  {
    id: "when-wrong-image",
    kind: "chat",
    worked: panel("when-wrong", "image"),
    variant: "feedback",
    head: {
      eyebrow: "18 · When it is wrong",
      title: { pre: "When a skill gets it wrong,", em: "say so in the chat." },
      sub: "Say what went wrong where you are already working. You see exactly what will be filed before anything is filed, and nothing goes anywhere until you say yes.",
    },
    thread: {
      title: "The new wave",
      turns: [
        {
          kind: "you",
          id: "say",
          slash: "/skill-feedback",
          text: "It passed a frame where the product is the wrong way round.",
        },
        { kind: "tool", id: "tool", text: "Reading the skill, and what is already open" },
        {
          kind: "claude",
          id: "confirm",
          blocks: [
            {
              kind: "p",
              text: "That goes to the owner of armada, and nothing like it is open yet. Exactly what I would file:",
            },
            {
              kind: "issue",
              title: "armada: a reversed product passed every check",
              rows: [
                { term: "What", def: "The trigger is mirrored, and no check looks" },
                { term: "Where", def: "Thoughtform Imagery, armada" },
                { term: "Evidence", def: "A link to the frame, never the file" },
              ],
            },
            { kind: "p", text: "Shall I file it?" },
          ],
        },
        { kind: "you", id: "yes", text: "Yes, file it." },
      ],
      composer: "Write a message",
    },
    aside: FEEDBACK_STEPS,
  },
  {
    id: "when-wrong-reference",
    kind: "chat",
    worked: panel("when-wrong", "reference"),
    variant: "feedback",
    head: {
      eyebrow: "18 · When it is wrong",
      title: { pre: "When a skill gets it wrong,", em: "say so in the chat." },
      sub: "Say what went wrong where you are already working. You see exactly what will be filed before anything is filed, and nothing goes anywhere until you say yes.",
    },
    thread: {
      title: "The look will not transfer",
      turns: [
        {
          kind: "you",
          id: "say",
          slash: "/skill-feedback",
          text: "It called one run a pass. That is the thing the file says not to do.",
        },
        { kind: "tool", id: "tool", text: "Reading the skill, and what is already open" },
        {
          kind: "claude",
          id: "confirm",
          blocks: [
            {
              kind: "p",
              text: "That goes to the owner of reference-decoder, and it contradicts the skill's own rule. Exactly what I would file:",
            },
            {
              kind: "issue",
              title: "reference-decoder: a single run reported as a measurement",
              rows: [
                { term: "What", def: "One run called an identity pass" },
                { term: "Where", def: "Thoughtform Reference, reference-decoder" },
                { term: "Rule", def: "A single run is a draft, never evidence" },
              ],
            },
            { kind: "p", text: "Shall I file it?" },
          ],
        },
        { kind: "you", id: "yes", text: "Yes, file it." },
      ],
      composer: "Write a message",
    },
    aside: FEEDBACK_STEPS,
  },
];

export const THOUGHTFORM_WORKSHOP_V2_ARC: ArcDef = {
  slug: "thoughtform-workshop-v2",
  leaf: "workshop-v2",
  format: "workshop",
  /* No `client` (a house format), no `theme` (it reads in both), no `motion`
     (reveal is the default). */
  status: "running",
  date: "2026-09-30",
  cardTitle: "The Thoughtform workshop · V2",
  cardLede:
    "The same story, and then the configuration actually built: a skill, its evals, and the plugin a team runs it from.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Workshop",
    title: { pre: "The capability", em: "your team owns." },
    lede: "The story first, and then the thing itself: a skill, its evals, and the plugin your team runs them from.",
    actions: [
      { id: "start", label: "The workshop", href: "#the-workshop", primary: true },
      { id: "made", label: "Made real", href: "#made-real-voice" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "The Thoughtform workshop · V2",
    description:
      "How to work with an intelligence rather than command it, and where the answer goes to live afterwards.",
  },
  sections: [
    /* ── Chapter one · THE WORKSHOP ────────────────────────────────────── */
    /* The opening slide is a SHARED RECORD (ADR-141 U2): the AP lecture opens
       on it too, so both read it by reference. */
    HAND_IT_TO_AN_AGENT,

    /* ── Chapter two · NAVIGATE ─────────────────────────────────────────
       The situation, in the Moira session's order (ADR-136), with the ground
       inserted after the curve where the argument needs it. */
    /* Loop's own stages, a SHARED RECORD since ADR-143: the third house cut
       shows this beat whole at the same place, so both read it by reference. */
    THREE_WAYS_LOOP,
    {
      id: "the-curve",
      kind: "curve",
      menuLabel: "The curve",
      head: {
        eyebrow: "03 · The curve",
        title: { pre: "Each release finishes longer work,", em: "and costs more per token." },
        sub: "It makes fewer small mistakes with every release, so it gets further on long and difficult work. And every model has a second dial: how hard it thinks.",
      },
      ...FRONTIER_CURVE,
    },
    {
      /* ⚠ THE BEAT THE PREVIOUS CUTS OWED THE ROOM (owner, 2026-09-30). It
         follows the curve because it is what the curve implies, and it comes
         before the spectrum because a room cannot be asked to steer a thing
         until it knows what the thing is standing on.

         ⚠ NO VENDOR IS NAMED. The argument is about a shape of purchase; a
         competitor's name dates the page the week it ships, and the room
         will supply its own examples out loud anyway.

         ⚠ THE QUOTE IS UNATTRIBUTED, ON PURPOSE. It went round when agents
         arrived and the practice has not traced it to a first source. It is
         set as a line the argument agrees with rather than as evidence, and
         it takes an attribution the day someone finds one. */
      id: "ground",
      kind: "ground",
      menuLabel: "Why here",
      head: {
        eyebrow: "04 · Why build it here",
        title: { pre: "One model got good enough", em: "at enough things." },
        sub: "So why build this inside a general model rather than buy the tool that already does the job? Because one model now does most of the jobs, and it is the only one that takes your instructions.",
      },
      shelf: {
        label: "What you would buy instead",
        line: "A tool for each job, each one good at it, and each one a world of its own.",
        items: [
          {
            id: "pictures",
            name: "A tool that makes pictures",
            cost: "Its own sign-in, its own bill",
          },
          {
            id: "motion",
            name: "A tool that makes motion",
            cost: "Its own account, its own limits",
          },
          {
            id: "words",
            name: "A tool that writes copy",
            cost: "Its own idea of your brand",
          },
          {
            id: "agent",
            name: "A tool with an agent in it",
            cost: "Someone else's judgement, priced monthly",
          },
        ],
      },
      floor: {
        label: "What the work actually stands on",
        steer: {
          tag: "You write this",
          line: "How your team works, and what good looks like. Nobody can write it for you.",
          items: ["The skills", "The evals"],
        },
        reach: {
          tag: "You connect this",
          line: "What it can reach, and what it can run. Set up once, for everyone.",
          items: ["Connectors", "Keys", "Tools of your own"],
        },
        base: {
          tag: "You cannot build this",
          name: "The intelligence itself",
          line: "The one layer nobody in this room can write. It took a frontier lab and a data centre. Everything above it is yours.",
        },
      },
      note: "A line that went round when the agents arrived, and nobody has claimed it: I do not want to use your agent, I want my agent to be able to use your tool.",
      alt: "A shelf of separate tools on the left, each with its own sign-in and bill; on the right one stack read from the floor up, the intelligence as its plinth, the reach connected to it, and the skills and evals the team writes on top",
    },
    {
      id: "between",
      kind: "spectrum",
      menuLabel: "Hard to steer",
      head: {
        eyebrow: "05 · Hard to steer",
        title: {
          pre: "But it is hard to steer,",
          em: "because it is a tool and a collaborator at once.",
        },
        sub: "Sometimes you tell it exactly what to do. Sometimes you explain what you are after and let it work it out. Nothing we worked with before was both.",
      },
      ...TOOL_AND_COLLABORATOR,
    },
    {
      id: "resource",
      kind: "resource",
      menuLabel: "A resource",
      head: {
        eyebrow: "06 · A strange resource",
        title: { pre: "We work with an intelligence,", em: "but measure it like software." },
        sub: "We count it in tokens, the way we count software in seats. Tokens say how much it read and wrote, and nothing about whether the work was any good.",
      },
      columns: ["Resource", "Counted in", "What the count tells you"],
      rows: [
        { id: "people", resource: "People", unit: "Hours", tells: "How long the work took" },
        { id: "money", resource: "Money", unit: "Euros", tells: "What the work cost" },
        { id: "software", resource: "Software", unit: "Seats", tells: "Who can use it" },
        {
          id: "intelligence",
          resource: "Intelligence",
          unit: "Tokens",
          tells: "How much the model read and wrote",
          misses: "Nothing about what it was worth, or whether it worked",
          open: true,
        },
      ],
    },
    {
      /* A beat: no picture, and twenty seconds of silence in the room. */
      id: "real-question",
      kind: "interstitial",
      variant: "question",
      eyebrow: "07 · The real question",
      line: {
        pre: "The real question is:",
        em: "how should intelligence take part in the work?",
      },
      subline:
        "Which model, how many tokens, whether it was any good: every question a team asks about it sits downstream of this one.",
    },

    /* ── Chapter three · ENCODE ──────────────────────────────────────── */
    {
      id: "configuration",
      kind: "questions",
      menuLabel: "The configuration",
      head: {
        eyebrow: "08 · The configuration",
        title: { pre: "One piece of work.", em: "Six questions around it." },
        sub: "The answer is written down, per piece of work. Here it is for one of mine. Today is about the two your team writes.",
      },
      work: {
        label: "The work",
        name: "A post in my voice",
        line: "One post, written from a brain dump and read against the house's own rules before it goes out.",
        bar: {
          label: "Good looks like",
          line: "Reads like me, says one thing, and claims nothing nobody measured.",
        },
      },
      left: [
        { id: "model", title: "The model", question: "What runs it", answer: "The everyday lane" },
        {
          id: "context",
          title: "The context",
          question: "What it knows",
          answer: "The voice, as a skill",
          lit: true,
        },
        {
          id: "evals",
          title: "The evaluations",
          question: "How we know it is good",
          answer: "Posts that went out, and posts sent back",
          lit: true,
        },
      ],
      right: [
        {
          id: "data",
          title: "The data",
          question: "What it can reach",
          answer: "My own posts, and the phrasebook",
        },
        {
          id: "interface",
          title: "The interface",
          question: "Where you meet it",
          answer: "In Claude, before it is posted",
        },
        {
          id: "owner",
          title: "The owner",
          question: "Who answers for it",
          answer: "I do. It drafts, I post",
          human: true,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
      tag: "You write this",
      alt: "One piece of work, a post in the founder's voice, with six questions wired around it: the context and the evaluations lit, the owner in green",
    },
    {
      id: "leverage",
      kind: "cards",
      menuLabel: "The two you write",
      columns: 2,
      /* ⚠ NOT "leverage" in the copy (the voice skill's post-2022 list): the
         grader fails the page on the word, and the id is not copy. */
      head: {
        eyebrow: "09 · The two you write",
        title: { pre: "Two of the six", em: "nobody can write for you." },
        sub: "The model, the data and the tools are set up across the company. What it knows and what good looks like can only come from the team doing the work, and both outlive the model that reads them.",
      },
      cards: [
        {
          id: "context",
          kicker: "The context",
          title: "What it knows",
          body: "How this team works, written down so a model can read it.",
          metaRows: [
            { label: "Rules", value: "What the team always checks" },
            { label: "Examples", value: "Good work, and work sent back" },
            { label: "Sources", value: "Where to look it up" },
          ],
        },
        {
          id: "evals",
          kicker: "The evaluations",
          title: "How we know it is good",
          body: "Real inputs, the result each must produce, and where it stops.",
          metaRows: [
            { label: "Cases", value: "Real inputs, with the expected result" },
            { label: "Checks", value: "What must be true of every output" },
            { label: "Gates", value: "Where it stops and asks a person" },
          ],
        },
      ],
    },
    {
      id: "person-or-agent",
      kind: "interstitial",
      variant: "question",
      eyebrow: "10 · The turn",
      line: { pre: "Is the workflow for a person,", em: "or for an agent?" },
      subline:
        "A workflow for a person has a person check in at every step. An agent that runs for hours needs the context and the evals instead, and finds the steps itself.",
    },
    {
      /* The turn's answer (ADR-139 U1): which work goes to the agent. Matthew
         Schwartz's convex hull, from "Claude-shaped science" (Anthropic): a
         team's knowledge is jagged, and an agent earns its keep in the bays
         between the spikes, where the work crosses fields and can be
         checked. It draws an argument, so it names its source (ADR-130's
         workshop clause). "Agent-shaped" on screen, Claude in the source:
         the ground beat names no vendor, and a fork reuses this unchanged. */
      id: "agent-shaped",
      kind: "hull",
      menuLabel: "Agent-shaped",
      head: {
        eyebrow: "11 · Agent-shaped work",
        title: { pre: "Give the agent the gaps", em: "between your experts." },
        sub: "Each person on the team knows one thing deeply. The space between them, wherever an answer can be checked, is where an agent does its best work.",
      },
      team: {
        label: "What your people know",
        line: "Deep in one direction each. That is where the judgement comes from.",
        roles: ["Copy", "Design", "Strategy", "Motion", "Media", "Data"],
      },
      field: {
        label: "What an agent can fill",
        line: "The space between them, wherever the answer can be checked.",
      },
      source: "After Matthew Schwartz, Claude-shaped science, Anthropic",
      alt: "Six spikes of uneven length, one per discipline, with a dashed line drawn round their tips; the bays between the spikes, inside the line, are filled with gold particles",
    },
    /* The horizon is a SHARED RECORD since ADR-143; the number is this page's. */
    theHorizon("12 · Why it needs checks", true),
    {
      id: "signal",
      kind: "signal",
      menuLabel: "The market",
      head: {
        eyebrow: "13 · Where the money goes",
        title: {
          pre: "The labs just bet billions",
          em: "on the two things only your team can write.",
        },
        sub: "Both labs are paying to put engineers inside companies to write their context down. The teams that write evals are the ones pulling ahead.",
      },
      /* The four clippings are a SHARED RECORD since ADR-143. */
      columns: MARKET_SIGNAL_COLUMNS,
      caption:
        "Four public sources from May to September 2026, dated on each card. The figures are theirs, not ours, and none of it is a study.",
    },

    /* ── Chapter four · BUILD — the configuration, made real ───────────
       Five switched beats, one piece of work followed the whole way down,
       then one bench all the way to the bottom. */
    ...MADE_REAL,
    ...THE_SKILL,
    ...THE_PLUGIN,
    ...USING_IT,
    ...WHEN_WRONG,
    {
      /* ⚠ NOT SWITCHED, AND THE REASON IS ON THE HEAD. The writing Skill is
         the only one of the three whose evals are written down today; two
         more benches would be two sets of invented checks, on the beat whose
         entire job is teaching a room what an eval is. */
      id: "the-bench",
      kind: "bench",
      menuLabel: "The bench",
      head: {
        eyebrow: "19 · The checks, running",
        title: { pre: "One of the three,", em: "all the way down." },
        sub: "Four checks the practice wrote for its own writing, run against a first draft and then against the same text rewritten. A check returns a state, never a score, and the verdict is the worst of them.",
      },
      example: WRITING_BENCH,
    },

    /* ── Chapter five · WHAT FOLLOWS ──────────────────────────────────── */
    {
      id: "the-family",
      kind: "list-groups",
      menuLabel: "Two more skills",
      layout: "stack",
      head: {
        eyebrow: "20 · The mother and the father",
        title: { pre: "Two skills", em: "look after all the others." },
        sub: "One reads the work against what the rest have learned; one sorts every remark the moment it arrives. Nothing merges without a person.",
      },
      groups: [
        {
          id: "mother",
          label: "The mother",
          blurb: "reads the work",
          items: [
            {
              id: "one",
              tag: "From words",
              name: "Never invent a particular",
              body: "Name what is missing, rather than filling it in.",
            },
            {
              id: "two",
              tag: "From pictures",
              name: "Never trust a single grade",
              body: "Three runs, majority per check, ties fail.",
            },
            {
              id: "three",
              tag: "From references",
              name: "State the fixture, not the falloff",
              body: "A thing that exists in a room transfers. A statistic does not.",
            },
          ],
        },
        {
          id: "father",
          label: "The father",
          blurb: "sorts every remark",
          items: [
            {
              id: "small",
              tag: "A small fix",
              name: "Drafted with its test",
              body: "The case that caught it joins the evals.",
            },
            {
              id: "rule",
              tag: "A rule or a fact",
              name: "Sent to the skill's owner",
              body: "Nobody else edits the words of a skill.",
            },
            {
              id: "broken",
              tag: "A broken script",
              name: "Sent to whoever writes them",
              body: "Not everything is a skill problem.",
            },
          ],
        },
      ],
    },
    /* Getting started is a SHARED RECORD since ADR-143; the number is this page's. */
    getStarted("21 · Get started", true),
    {
      id: "whats-next",
      kind: "list-groups",
      menuLabel: "What is next",
      layout: "readout",
      head: {
        eyebrow: "22 · What is next",
        title: { pre: "What you leave with,", em: "and what you run next." },
        sub: "The workshop ends with one piece of work chosen, its six questions answered on a page, and the first skill started.",
      },
      groups: [
        {
          id: "today",
          label: "Running today",
          blurb: "what you leave with",
          items: [
            { id: "plugin", tag: "Live", name: "Your team's plugin, switched on" },
            { id: "skill", tag: "Live", name: "One skill, from your own work" },
            { id: "evals", tag: "Live", name: "Its first cases, from real requests" },
            { id: "feedback", tag: "Live", name: "Feedback, in the chat itself" },
          ],
          foot: {
            label: "The check",
            lines: ["The second run needs fewer notes than the first."],
          },
        },
        {
          id: "next",
          label: "The loop after that",
          blurb: "what you do without me",
          items: [
            { id: "second", tag: "Week two", name: "A second workstream, same shape" },
            { id: "owner", tag: "Week two", name: "An owner named for each skill" },
            { id: "mother", tag: "Later", name: "The mother, reading across them" },
            { id: "hand", tag: "Dated", name: "Handover, with a date on it" },
          ],
          foot: {
            label: "The point",
            lines: ["Every workstream after this one", "runs the same six questions."],
          },
        },
      ],
    },
    /* The close's title, sub and actions are a SHARED RECORD since ADR-143
       (the third house cut ends on them too); the number is this page's. */
    whatFollows("23 · What follows"),
  ],
};
