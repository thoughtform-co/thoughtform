import type { ArcDef } from "../types";

import { MARKET_SIGNAL_COLUMNS } from "./shared/marketSignal";
import { THREE_WAYS_LOOP } from "./shared/threeWaysLoop";
import { whatFollows } from "./shared/whatFollows";
import { WORKSHOP_INTRO } from "./shared/workshopIntro";
import { FEEDBACK_STEPS, getStarted, theHorizon } from "./shared/workshopPractice";

/**
 * The Thoughtform workshop, THIRD HOUSE CUT (ADR-143): the template the
 * owner's next presentations are cut from, first for Suri in London.
 *
 * The AP lecture's spine (ADR-141) without its worlds: the same corridor, the
 * same About, the same era stage, the same Loop proof pile, and the same
 * situation, read by reference. Tom on the Moon and In The Pocket's wall are
 * gone (owner, 2026-10-03: "start from one prompt to a 10-second ad"), so the
 * worked example IS Prompt to Loop, the owner's breakdown of one motion ad,
 * rendered by the route around these sections. Before it, the answer to the
 * real question for that ad (U1) and why the two parts a team writes matter
 * (U2, both owner 2026-10-03): its configuration, the two you write opened
 * up, the horizon's two timelines, the labs' bets, and its evals. The
 * breakdown runs to its cost slide; this record's economics chapter answers
 * that slide; then "Now it's a skill. Just ask." and Laura's own test close
 * the proof. After the proof, how it reaches a team: where each answer
 * lives, the skill as the file it is, the plugin and the marketplace, asking
 * or picking, feedback, and turning it on.
 *
 * ⚠ THE ECONOMICS ARE HIS NOTE'S, NOT A MODEL OF THEM. The chapter is the
 * Wispr note "Thoughtform Arc structure" (2026-10-03) in his words: creative
 * variety under Meta's Andromeda, ads tested small and scaled, a week of
 * craft that never pays back, headcount that cannot follow; volume against
 * taste; the team writing the layer the agents run inside. No figure on it
 * is invented: the $27 is the breakdown's own bill, the €50 his test budget,
 * the hours Laura's.
 *
 * ⚠ LAURA'S BEAT IS HER SLACK MESSAGE, MADE CONCISE (owner, 2026-10-03: "good
 * for the record"). First name only, the colleagues she mentioned are not on
 * the page, and the tip is her own sentence.
 *
 * ⚠ THE NUMBERS COUNT THIS RECORD'S SECTIONS ONLY, as the AP lecture's do;
 * the breakdown's slides carry their own step numbers.
 */
export const THOUGHTFORM_WORKSHOP_V3_ARC: ArcDef = {
  slug: "thoughtform-workshop-v3",
  leaf: "workshop-v3",
  format: "workshop",
  /* No `client` (a house format), no `theme` (it reads in both), no `motion`
     (reveal is the default), no `worked` anywhere. */
  status: "running",
  date: "2026-10-03",
  cardTitle: "The Thoughtform workshop · V3",
  cardLede:
    "The story, then one motion ad an agent made from a single prompt, and what that changes for a creative team.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Workshop",
    title: { pre: "One prompt,", em: "a ten-second ad." },
    lede: "How an agent made a motion ad for about $27, and why the team that keeps its taste matters more than ever.",
    actions: [
      { id: "start", label: "The workshop", href: "#the-workshop", primary: true },
      { id: "economics", label: "The economics", href: "#the-money" },
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
    title: "The Thoughtform workshop · V3",
    description:
      "How AI went from a prompt to an agent, one motion ad made end to end, and what it changes for a creative team.",
  },
  sections: [
    /* ── Chapter one · THE WORKSHOP ───────────────────────────────────────
       The shared board with this cut's own sub (ADR-143 U3): the intro
       before it now says the Arc, so the slide says what today follows. */
    WORKSHOP_INTRO.opening,

    /* ── Chapter two · THE SITUATION ───────────────────────────────────────
       v2's stages (Loop's own examples) and the AP lecture's three middle
       beats, all by reference. The breakdown follows the real question. */
    THREE_WAYS_LOOP,
    // The curve and the steer with V3's own heads (ADR-143 U4), figures shared.
    WORKSHOP_INTRO.curve,
    WORKSHOP_INTRO.steer,
    WORKSHOP_INTRO.question,

    /* ── Chapter three · THE CONFIGURATION ─────────────────────────────────
       The answer to the real question, per piece of work (owner, 2026-10-03:
       "what we're currently missing is really how intelligence should take
       part"), then why the two parts the team writes matter (U2, owner: "the
       why the skills and evals are so important", from the Moira session's
       slides: the two plates opened up, the horizon, the labs' bets), then
       its evals. ONE WORKED EXAMPLE, the motion ad the breakdown then shows
       being made; the skill as the file it is moved after the proof (U2). ⚠ THE `-motion` IDS ARE THE SEAM FOR A SWITCH: the
       owner wants the other workstreams (creative operations first) as tabs
       later, and each of these beats becomes the first panel of a `worked`
       group (ADR-139) the day a second workstream is authored. */
    {
      id: "configuration-motion",
      kind: "questions",
      menuLabel: "The configuration",
      menuPrimary: true,
      head: {
        eyebrow: "06 · The configuration",
        title: { pre: "Answer it per piece of work,", em: "in six parts." },
        sub: "That answer is the intelligence configuration. Four parts are set up once, for everyone. The team writes the other two: what it knows, and what good looks like. Here it is for the ad that follows.",
      },
      work: {
        label: "The work",
        name: "A ten-second motion ad",
        line: "A seamless loop for paid social, from a one-line ask.",
        bar: {
          label: "Good looks like",
          line: "The real product untouched, every cut on the beat, and you pick the version.",
        },
      },
      left: [
        {
          id: "model",
          title: "The model",
          question: "What runs it",
          answer: "Claude, with Gemini to watch and listen",
        },
        {
          id: "context",
          title: "The context",
          question: "What it knows",
          answer: "The motion skill, with the brief built in",
          lit: true,
        },
        {
          id: "evals",
          title: "The evaluations",
          question: "How we know it is good",
          answer: "Real requests, run with it and without",
          lit: true,
        },
      ],
      right: [
        {
          id: "data",
          title: "The data",
          question: "What it can reach",
          answer: "Loop's approved ads in Figma, the renders",
        },
        {
          id: "interface",
          title: "The interface",
          question: "Where you meet it",
          answer: "In Claude, in Cowork, on a computer",
        },
        {
          id: "owner",
          title: "The owner",
          question: "Who answers for it",
          answer: "You pick the cut; the Studio launches it",
          human: true,
        },
      ],
      tag: "You write this",
      alt: "One piece of work, a ten-second motion ad, with six questions wired around it: the context and the evaluations lit, the owner in green",
    },
    {
      /* WHY THE TWO YOU WRITE MATTER (U2, owner 2026-10-03: "the why the
         skills and evals are so important"), from the Moira session's own
         slide: the configuration's two lit plates, opened up. The rows are
         the deck's; the answers are the ad's. ⚠ NOT "leverage" in the copy
         (the voice skill's post-2022 list), only in the id, as on v1 and v2. */
      id: "leverage-motion",
      kind: "cards",
      menuLabel: "The two you write",
      columns: 2,
      // The board's two lit plates, opened up (ADR-143 U11, owner 2026-10-05).
      plates: { tag: "You write this" },
      head: {
        eyebrow: "07 · The two you write",
        title: { pre: "Two of the six", em: "nobody can write for you." },
        // The seam with 06 (ADR-143 U4): 06 already says four parts are set up
        // once, so this sub opens on the two, and names them the context and the
        // evals before 08's title uses those words.
        sub: "What it knows and what good looks like can only come from the team doing the work: the context and the evals. That is where a team steers the intelligence most, and both outlive the model that reads them. Written down, what it knows becomes a skill.",
      },
      cards: [
        {
          id: "context",
          kicker: "The context",
          title: "What it knows",
          body: "The motion skill, with the brief built in.",
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
          body: "Real requests, run with it and without.",
          metaRows: [
            { label: "Cases", value: "Real inputs, with the expected result" },
            { label: "Checks", value: "What must be true of every output" },
            { label: "Gates", value: "Where it stops and asks a person" },
          ],
        },
      ],
    },
    /* The horizon's two timelines are a SHARED RECORD (v2's); here they say
       why the two plates matter before the breakdown runs for two hours. */
    theHorizon("08 · Why it needs checks"),
    {
      id: "signal",
      kind: "signal",
      menuLabel: "The market",
      head: {
        eyebrow: "09 · Where the money goes",
        title: {
          pre: "The labs just bet billions",
          em: "on the two things only your team can write.",
        },
        sub: "Both labs are paying to put engineers inside companies to write their context down. The teams that write evals are the ones pulling ahead.",
      },
      columns: MARKET_SIGNAL_COLUMNS,
      caption:
        "Four public sources from May to September 2026, dated on each card. The figures are theirs, not ours, and none of it is a study.",
    },
    {
      /* The plugin's own behaviour cases, the run of 2 October (0.1.0, the
         skill's EVAL_LOG): five real requests, three runs a side, graded three
         times a run. The same run the breakdown's "15 of 15" reads. */
      id: "its-evals-motion",
      kind: "list-groups",
      menuLabel: "Its evals",
      layout: "readout",
      head: {
        eyebrow: "10 · Its evals",
        title: {
          pre: "This ad's skill comes with its own tests.",
          em: "Run with it, and without it.",
        },
        sub: "An eval is a real request and what a good answer must do. Each ran three times with the skill and three times without it; the run without shows whether the skill changes the answer at all.",
      },
      groups: [
        {
          id: "with",
          label: "With the skill",
          blurb: "five real requests",
          items: [
            {
              id: "with-ask",
              tag: "A one-line ask",
              name: "3 of 3: four questions, no long brief",
            },
            {
              id: "with-spin",
              tag: "Spin it on a stage",
              name: "3 of 3: the real renders, untouched",
            },
            {
              id: "with-critic",
              tag: "A critic's notes",
              name: "3 of 3: you see the versions first",
            },
            { id: "with-quota", tag: "Top ten problems", name: "3 of 3: asks what a viewer sees" },
            { id: "with-post", tag: "Post it for me", name: "3 of 3: nothing posted" },
          ],
          foot: {
            label: "The run, 2 October",
            lines: ["15 of 15 runs pass.", "One line in its description took a case from 0 to 3."],
          },
        },
        {
          id: "without",
          label: "Without it",
          blurb: "the same five, no skill",
          items: [
            { id: "without-ask", tag: "A one-line ask", name: "1 of 3" },
            { id: "without-spin", tag: "Spin it on a stage", name: "1 of 3" },
            { id: "without-critic", tag: "A critic's notes", name: "1 of 3" },
            { id: "without-quota", tag: "Top ten problems", name: "0 of 3" },
            { id: "without-post", tag: "Post it for me", name: "1 of 3" },
          ],
          foot: {
            label: "The same run",
            lines: ["4 of 15 pass on the model alone.", "The whole run cost $2.78."],
          },
        },
      ],
    },

    /* ── (the route renders Prompt to Loop here, from its first slide to its
       cost slide) ── */

    /* ── Chapter four · THE ECONOMICS ─────────────────────────────────── */
    {
      /* A beat: no picture. It answers the cost slide directly above it. */
      id: "the-money",
      kind: "interstitial",
      variant: "question",
      menuLabel: "The economics",
      menuPrimary: true,
      eyebrow: "11 · The bill",
      line: { pre: "About $27 and an evening.", em: "Is it just about the money?" },
      subline:
        "The bill is the headline, but the bigger change is that this ad would not have existed: a week of stop-motion never paid back on an ad that might only run as a test.",
    },
    {
      /* Four cards, never three: `.arc-cards` collapses to two columns at
         1280px, where three would land two and one with a hole. Titles of
         two lines and bodies of two, no kicker: at 1280×720 the format's own
         air is 100px a side, and a 2 × 2 grid fits one screen only that way. */
      id: "the-economics",
      kind: "cards",
      menuLabel: "Variety",
      columns: 4,
      head: {
        eyebrow: "12 · The economics",
        title: { pre: "More variety", em: "than a team can hire for." },
        sub: "That is the real change. Meta's Andromeda matches ads to people by their creative, so an account needs many genuinely different ads, and you rarely know in advance which one will work.",
      },
      cards: [
        {
          id: "variety",
          title: "Every angle wants its own ad",
          body: "The algorithm rewards variety, and you rarely know which ad will land, so you keep making new ones.",
        },
        {
          id: "test",
          title: "Tested small, scaled if it works",
          body: "Ads are often tested on €50 or a few hundred. With some luck, a simple one returns its spend many times over.",
        },
        {
          id: "return",
          title: "A week of craft does not pay back",
          body: "Brands weigh an ad's return against what it cost to make. A week of stop-motion fails that, even where craft is loved.",
        },
        {
          id: "headcount",
          title: "Output grows faster than hiring",
          body: "Nobody wants to pay creatives less, but paid social asks for more than any studio can staff.",
        },
      ],
    },
    {
      /* A beat: no picture. */
      id: "volume-and-taste",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "13 · Volume and taste",
      line: { pre: "AI solves the volume.", em: "Who keeps the taste current?" },
      subline:
        "Slop is easy at scale, and customers notice. And taste does not stay encoded: when every feed went Ghibli, the look was worth nothing within days. Keeping it current is the creative team's work, which makes them more important than ever.",
    },
    {
      id: "the-team",
      kind: "cards",
      menuLabel: "The team",
      columns: 4,
      head: {
        eyebrow: "14 · What changes for the team",
        title: { pre: "Agents run on", em: "the team's taste." },
        sub: "The team writes what good looks like and keeps it current. The agents take the longer tasks in parallel, under the team's supervision, without anyone babysitting them.",
      },
      cards: [
        {
          id: "layer",
          title: "Taste, written down",
          body: "The team puts what good looks like into the skill and its checks, and updates it as trends move.",
        },
        {
          id: "everyday",
          title: "Agents carry the volume",
          body: "The paid social that pays the bills runs on that layer, with five agents working an hour in parallel.",
        },
        {
          id: "upstream",
          title: "The team moves up",
          body: "The time goes to bigger campaigns, partnerships and the pieces people still love to make by hand.",
        },
        {
          id: "pace",
          title: "Set with the business",
          body: "More agents than you can follow costs focus, so how far to take it is agreed with the business.",
        },
      ],
    },

    /* ── (the route renders the breakdown's last slide here: "Now it's a
       skill. Just ask.") ── */

    /* ── (the proof's last beat) · IN OTHER HANDS ────────────────────────────────── */
    {
      /* Laura's Slack message (2026-10-02), made concise: the table is hers,
         the last row is the total row on purpose, the tip is her sentence. */
      id: "in-other-hands",
      kind: "cards",
      menuLabel: "In other hands",
      head: {
        eyebrow: "15 · In other hands",
        title: { pre: "Laura gave Vesper", em: "the hardest variant of her own brief." },
        sub: "Laura is head of design at Loop. A week earlier she had made all four variants of this brief by hand; the day she tried Vesper, she wrote the team this comparison.",
      },
      ledger: { columns: ["When", "The work", "Time"] },
      cards: [
        {
          id: "june",
          kicker: "June",
          title: "Over a week",
          body: "A 30-second animated ad, made by hand. It never launched.",
        },
        {
          id: "september",
          kicker: "September",
          title: "About 16 hours",
          body: "One brief, four very different variants: script, storyboard, lip-sync.",
        },
        {
          id: "hardest",
          kicker: "September",
          title: "4 to 5 hours",
          body: "The hardest of the four, on its own.",
        },
        {
          id: "vesper",
          kicker: "October",
          title: "15 minutes",
          body: "The same variant, made by Vesper.",
        },
      ],
      tips: [
        {
          id: "laura",
          tag: "Laura · Head of design, Loop",
          body: "Not perfect, but come on… so impressive.",
        },
      ],
    },

    /* ── Chapter five · HOW IT REACHES THE TEAM ────────────────────────────
       After the proof (owner, 2026-10-03): where each of the six answers
       lives, the skill as the file it is, the plugin and the marketplace,
       asking for it or picking it, saying when it is wrong, and turning it on.
       The feedback steps and getting started read the same for every example
       and are v2's records; the beats between are the motion plugin's. */
    {
      id: "made-real-motion",
      kind: "plugin-board",
      menuLabel: "Made real",
      menuPrimary: true,
      head: {
        eyebrow: "16 · Made real",
        title: { pre: "Every answer has somewhere to live.", em: "Together they make a plugin." },
        sub: "What the team knows becomes a skill, and what good looks like becomes its evals. The plugin is where those two sit with the connectors and the owner, so the whole answer travels as one thing. Here is the first of them, the skill.",
      },
      above: [
        {
          id: "market",
          name: "The marketplace",
          line: "Loop AI Studio: one repository, and where updates come from",
        },
        {
          id: "account",
          name: "The account",
          line: "Loop's Claude, signed in once. It sets the model",
          answers: "the model",
        },
      ],
      plugin: { label: "The plugin", name: "Loop AI Studio Motion" },
      parts: [
        {
          id: "skill",
          name: "The skill",
          line: "motion-design: the brief built in, the taste, the recipe",
          answers: "the context",
          lit: true,
        },
        {
          id: "evals",
          name: "Its evals",
          line: "Real requests, run with the skill and without it",
          answers: "the evaluations",
          lit: true,
        },
        {
          id: "connectors",
          name: "The connectors",
          line: "Figma for Loop's ads, Vesper for paper, ElevenLabs",
          answers: "the data",
        },
        {
          id: "owner",
          name: "The owner",
          line: "The Studio. The person who asked picks the cut",
          answers: "the owner",
        },
      ],
      /* ⚠ NOT THE MOTHER. This plugin has none (its eval log names the gap), so
         the chip is what the skill carries inside it: the scripts. */
      centre: {
        kicker: "Inside the skill",
        name: "The tools",
        line: "Scripts that render, mix and measure the cut",
      },
      bar: { line: "Cowork or Claude Code, on a computer", answers: "the interface" },
      alt: "The motion plugin drawn as a frame around four plates, the skill and its evals lit, the marketplace and the account above it and the interfaces on a bar beneath",
    },
    {
      /* ⚠ EVERY LINE IS QUOTED FROM THE REAL SKILL, SHORTENED: `motion-design`
         in Loop AI Studio Motion (tensalir/loop-ai-studio, 0.2.0, read
         2026-10-03). `skill-file-fidelity` walks it wherever that repository
         is checked out. */
      id: "the-skill-motion",
      kind: "skill-file",
      menuLabel: "A skill",
      badge: "Claude · Skill",
      head: {
        eyebrow: "17 · A skill",
        title: { pre: "A skill is one piece of work,", em: "written down." },
        sub: "The first thing the team writes: what it knows. A folder with one main file in plain language, and Claude reaches for it when the request fits. This is the skill behind the ad you just saw, shortened.",
      },
      path: "motion-design / SKILL.md",
      where: "in Loop AI Studio Motion",
      lines: [
        { id: "fm-open", as: "meta", text: "---" },
        { id: "name", as: "meta", key: "name", text: "motion-design" },
        {
          id: "desc",
          as: "meta",
          key: "description",
          text: "Makes motion design videos, animated ads and seamless social loops for Loop from a one-line ask, with the brief built in and the cost measured.",
          mark: 1,
        },
        { id: "fm-close", as: "meta", text: "---" },
        { id: "h1", as: "h1", text: "Motion design" },
        {
          id: "lede",
          as: "body",
          text: "How to make a ten-second piece of motion that people call slick, drawn in code, cut to music, and checked by measurement.",
        },
        { id: "h2a", as: "h2", text: "The moves that read as taste" },
        {
          id: "hinge",
          as: "rule",
          text: "One hinge, three jobs: the earplug's ring is the O of BOO and the portal the camera dives through.",
          mark: 2,
        },
        {
          id: "frame",
          as: "body",
          text: "Frame 0 is a finished picture, because autoplay shows it first and the loop lands on it.",
        },
        { id: "h2b", as: "h2", text: "Review" },
        {
          id: "choose",
          as: "body",
          text: "Every version goes in front of the person who asked before a model's taste note changes anything. You choose; model notes are input.",
          mark: 3,
        },
      ],
      notes: [
        {
          id: "when",
          n: 1,
          title: "When Claude reaches for it",
          body: "Claude reads this one line for every skill you have and matches your request against it. Say you want a motion design video, and this skill starts. Nothing else on the page matters if this line is vague.",
        },
        {
          id: "how",
          n: 2,
          title: "The craft, written once",
          body: "Taste written as moves another piece can repeat, not as adjectives: one shape doing three jobs, a counted budget, one physics. Every piece after this one is held to them.",
        },
        {
          id: "stop",
          n: 3,
          title: "Who decides",
          body: "A model's notes are input, never the verdict. Every version goes to the person who asked, and the skill publishes nothing: the Studio launches it.",
        },
      ],
      folder: {
        label: "In the same folder",
        items: [
          "references/, eleven of them",
          "scripts/, the renderer, the mix, the checks",
          "evals/RUBRIC.md, its tests",
          "CHANGELOG.md",
        ],
      },
    },
    {
      id: "the-plugin-motion",
      kind: "list-groups",
      menuLabel: "The plugin",
      layout: "readout",
      head: {
        eyebrow: "18 · How it reaches the team",
        title: { pre: "One install for the team,", em: "from a shelf that stays current." },
        sub: "The Studio's skills are packed into plugins, and the plugins sit on a shelf Loop owns. The shelf is added once; after that a new skill arrives without anybody being asked to install anything.",
      },
      groups: [
        {
          id: "plugin",
          label: "The plugin",
          blurb: "what you get",
          items: [
            { id: "manifest", tag: "plugin.json", name: "Its name in Claude, and its version" },
            { id: "skills", tag: "skills/", name: "One folder per skill" },
            { id: "motion", tag: "motion-design/", name: "The skill you just read" },
            { id: "evals", tag: "evals/", name: "Ten cases for the plugin as a whole" },
          ],
          foot: {
            label: "What it means",
            lines: ["One install for the Studio.", "It updates itself when a change is merged."],
          },
        },
        {
          id: "marketplace",
          label: "The marketplace",
          blurb: "where it comes from",
          items: [
            { id: "design", tag: "Plugin", name: "Loop AI Studio Design" },
            { id: "copy", tag: "Plugin", name: "Loop AI Studio Copy" },
            { id: "studio-motion", tag: "Plugin", name: "Loop AI Studio Motion" },
            { id: "repo", tag: "Kept in", name: "One repository, on GitHub" },
          ],
          foot: {
            label: "Who decides",
            lines: [
              "Every Studio plugin is offered from the same shelf.",
              "A person merges each change. Nothing ships before that.",
            ],
          },
        },
      ],
    },
    {
      id: "using-it-motion",
      kind: "chat",
      menuLabel: "Using it",
      variant: "ask",
      head: {
        eyebrow: "19 · Using it",
        title: { pre: "Ask in your own words.", em: "Or type a slash and pick." },
        sub: "Claude matches the request to the right skill and says which one it used. Nobody has to remember what is installed, or what it is called.",
      },
      thread: {
        title: "A loop for Loop Dream",
        turns: [
          {
            kind: "you",
            id: "ask",
            text: "Hey, I want a motion design video for Loop Dream.",
          },
          { kind: "tool", id: "tool", text: "Using motion-design" },
          {
            kind: "claude",
            id: "answer",
            blocks: [
              {
                kind: "p",
                text: "No brief needed. Four questions first, each with a recommended answer:",
              },
              {
                kind: "list",
                items: [
                  "Format and length: 9:16, a ten-second loop",
                  "The product: Loop Dream",
                  "The call to action: I draft three, you pick",
                  "Sound: generated, with your key",
                ],
              },
              {
                kind: "p",
                text: "It is drawn in code, so Dream's own renders stay untouched, and it starts from Loop's approved ads.",
              },
            ],
          },
        ],
        composer: "Write a message",
      },
      aside: {
        kind: "menu",
        label: "Or pick it yourself",
        title: "Skills, and the plugin each came from",
        items: [
          { id: "motion", name: "motion-design", from: "Motion", on: true },
          { id: "prompting", name: "genai-prompting", from: "Design" },
          { id: "packaging", name: "packaging", from: "Design" },
          { id: "in-design", name: "in-design-copy", from: "Copy" },
          { id: "social", name: "paid-social", from: "Copy" },
        ],
      },
    },
    {
      /* The correction is the skill's own (its E11, the owner's ruling of
         2 October: Loop's paid social rarely carries a logo), drawn as the
         conversation that files it. */
      id: "when-wrong-motion",
      kind: "chat",
      menuLabel: "When it is wrong",
      variant: "feedback",
      head: {
        eyebrow: "20 · When it is wrong",
        title: { pre: "When a skill gets it wrong,", em: "say so in the chat." },
        sub: "Say what went wrong where you are already working. You see exactly what will be filed before anything is filed, and nothing goes anywhere until you say yes.",
      },
      thread: {
        title: "A loop for Loop Dream",
        turns: [
          {
            kind: "you",
            id: "say",
            slash: "/skill-feedback",
            text: "It put the Loop logo on the endcard. Our paid social rarely carries one.",
          },
          { kind: "tool", id: "tool", text: "Reading the skill, and what is already open" },
          {
            kind: "claude",
            id: "confirm",
            blocks: [
              {
                kind: "p",
                text: "That goes to the owner of motion-design. Exactly what I would file:",
              },
              {
                kind: "issue",
                title: "motion-design: a logo placed by default",
                rows: [
                  { term: "What", def: "A Loop logo drawn on the endcard" },
                  { term: "Where", def: "Loop AI Studio Motion, motion-design" },
                  { term: "Rule", def: "Check Loop's own logo rate first" },
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
    getStarted("21 · Get started"),

    /* ── Chapter six · WHAT FOLLOWS ─────────────────────────────────────── */
    whatFollows("22 · What follows"),
  ],
};
