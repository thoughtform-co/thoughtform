import type { ArcDef } from "../types";

/**
 * PLOPSA, DE SETUP IN DE PRAKTIJK: the workshop page's practical companion,
 * in the client's own language.
 *
 * Owner, 2026-10-07: "for both suri and plopsa i want a simple page that
 * explains very clearly and concisely the steps of plugins / marketplace /
 * skill / github and vercel to host api keys / route feedback". The same
 * beats as `suri-guide` (ADR-151 U1: the callout, then the `guide` kind's map,
 * checklist, matrix and pipeline), with Plopsa's own facts: two plugins, a
 * repository still under Thoughtform's account until Plopsa has its own, and
 * a feedback path that is drawn as what follows, because it is not built yet.
 *
 * ⚠ EVERY STEP IS THE REPOSITORY'S OWN, read from `plopsa-ai-studio` on
 * 7 October 2026 (`docs/SETUP.md`, `docs/CHANGING-A-RULE.md`, `README.md`,
 * `.claude-plugin/marketplace.json`) and the workshop page's IT beat. The
 * feedback beat is the kit's path (the connector every repository built from
 * the kit carries), marked "Volgt" until Plopsa's own runs.
 *
 * ⚠ IT IS THE CLIENT'S PAGE, IN FLEMISH. People by role; no price, no key,
 * no fleet word; an image is a "beeld", never a "plaat" (owner, 2026-09-28);
 * no title opens on a count or pivots on "niet X maar Y" (ADR-130 U2).
 */
export const PLOPSA_GUIDE_ARC: ArcDef = {
  slug: "plopsa-guide",
  leaf: "guide",
  format: "workshop",
  client: "plopsa",
  kind: "workshop",
  cardChip: "guide",
  status: "running",
  date: "2026-10-07",
  cardTitle: "Plopsa · de setup in de praktijk",
  cardLede:
    "De plugins, de marketplace, GitHub en Vercel: wie wat instelt, waar de sleutels staan en hoe feedback bij de eigenaar van een skill komt.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Plopsa · De setup in de praktijk",
    title: { pre: "De setup", em: "in de praktijk." },
    lede: "Hoe de skills van Plopsa bij het team komen, en hoe ze beter worden.",
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
    title: "Plopsa · De setup in de praktijk",
    description:
      "Hoe Plopsa's Claude-plugins bij het team komen: de skills, de marketplace, GitHub, de sleutels, en de weg die een opmerking aflegt naar de eigenaar van een skill.",
  },
  sections: [
    /* ── 01 · Het systeem ──────────────────────────────────────────────── */
    {
      id: "systeem",
      kind: "guide",
      menuLabel: "Het systeem",
      menuPrimary: true,
      head: {
        eyebrow: "01 · Het systeem",
        title: { pre: "Het", em: "systeem." },
      },
      guide: {
        view: "system",
        paragraphs: [
          "De skills van Plopsa zijn tekstbestanden in één privé-repository op GitHub. Claude haalt die op, en elke samengevoegde wijziging is binnen 30 minuten bij het hele team. Doet een skill het fout, dan typt iemand /skill-feedback: een dienst op Vercel dient het in als GitHub-issue, de eigenaar beslist, en de fix komt langs dezelfde weg terug.",
        ],
        stack: [
          {
            label: "GitHub",
            name: "plopsa-ai-studio",
            child: {
              label: "Plugins · plopsa, creative",
              items: ["brand", "copy", "menuprijzen", "visuals", "mother"],
            },
          },
          {
            label: "Claude",
            name: "De organisatie van Plopsa",
            items: ["Chat", "Desktop", "Cowork", "Claude Code"],
            lit: true,
          },
          {
            label: "Vercel",
            name: "Feedbackconnector",
            line: "/skill-feedback → GitHub-issue → de eigenaar beslist",
            state: "Volgt",
          },
        ],
        between: ["Sync · binnen 30 min", "/skill-feedback"],
        back: "Issue",
        alt: "Drie panelen onder elkaar. GitHub bevat de repository plopsa-ai-studio, met daarin de marketplace en daarin de plugins plopsa en creative. Een pijl met het woord sync leidt naar de Claude-organisatie van Plopsa, die de plugins installeert in de chat, Desktop, Cowork en Claude Code. Een pijl met /skill-feedback leidt naar de feedbackconnector op Vercel, die nog volgt, en een stippellijn met het woord issue loopt terug omhoog naar GitHub.",
      },
    },

    /* ── 02 · Setup ─────────────────────────────────────────────────────── */
    {
      id: "setup",
      kind: "guide",
      menuLabel: "Setup",
      menuPrimary: true,
      head: {
        eyebrow: "02 · Setup",
        title: { pre: "Setup", em: "per tool." },
        sub: "Elke stap één keer. De link opent de pagina waar het gebeurt.",
      },
      guide: {
        view: "tools",
        labels: { done: "· klaar" },
        tools: [
          {
            id: "github",
            label: "GitHub",
            role: "GitHub-beheerder",
            what: "Bevat de repository. Elke wijziging is een pull request.",
            steps: [
              {
                id: "account",
                title: "Een GitHub-account voor Plopsa",
                line: "De repository verhuist erheen.",
                href: "https://github.com/account/organizations/new",
              },
              {
                id: "app",
                title: "De Claude GitHub App installeren",
                line: "",
                href: "https://github.com/apps/claude",
              },
              {
                id: "merge",
                title: "Pull requests samenvoegen",
                line: "Een GitHub Action verhoogt de versie.",
                href: "https://github.com/thoughtform-co/plopsa-ai-studio/pulls",
              },
            ],
          },
          {
            id: "keys",
            label: "Google · OpenAI",
            role: "IT",
            what: "Geeft de modelsleutels en de aanmelding uit.",
            steps: [
              {
                id: "gemini",
                title: "De Gemini-sleutel aanmaken",
                line: "Via de wachtwoordmanager.",
                href: "https://aistudio.google.com/apikey",
              },
              {
                id: "openai",
                title: "De OpenAI-sleutel aanmaken",
                line: "Gefactureerd per aanroep.",
                href: "https://platform.openai.com/api-keys",
              },
              {
                id: "signin",
                title: "Een project voor de aanmelding",
                line: "Enkel Plopsa-accounts.",
                href: "https://console.cloud.google.com/projectcreate",
              },
            ],
          },
          {
            id: "vercel",
            label: "Vercel",
            role: "De beheerder",
            what: "Draait straks de feedbackconnector.",
            state: "Volgt",
            steps: [
              {
                id: "team",
                title: "Een Pro-team aanmaken",
                line: "Hobby is enkel voor persoonlijk gebruik.",
                href: "https://vercel.com/dashboard",
              },
              {
                id: "deploy",
                title: "De connector uitrollen",
                line: "Met het script van de kit.",
              },
            ],
          },
          {
            id: "claude",
            label: "Claude",
            role: "Claude-eigenaar",
            what: "Haalt op en installeert de plugins.",
            steps: [
              {
                id: "sync",
                title: "De repository koppelen",
                line: "De eerste sync duurt tot 30 minuten.",
                href: "https://claude.ai/admin-settings/skills?tab=inventory",
              },
              {
                id: "default",
                title: "Installeren voor het team",
                line: "plopsa voor iedereen, creative voor het team.",
                href: "https://claude.ai/admin-settings/skills?tab=inventory",
              },
              {
                id: "auto",
                title: "Sync automatically aanzetten",
                line: "Vraagt beheerderstoegang op GitHub.",
                href: "https://claude.ai/admin-settings/skills?tab=marketplaces",
              },
              {
                id: "zips",
                title: "De zips weghalen",
                line: "",
                href: "https://claude.ai/admin-settings/skills",
              },
              {
                id: "connector",
                title: "De connector toevoegen",
                line: "Voor iedereen, als laatste.",
                href: "https://claude.ai/settings/connectors",
              },
            ],
          },
        ],
      },
    },

    /* ── 03 · Sleutels ─────────────────────────────────────────────────── */
    {
      id: "sleutels",
      kind: "guide",
      menuLabel: "Sleutels",
      menuPrimary: true,
      head: {
        eyebrow: "03 · Sleutels",
        title: { pre: "Waar elke sleutel", em: "staat." },
        sub: "De skills lezen een sleutel bij naam en tonen hem nooit.",
      },
      guide: {
        view: "matrix",
        label: "Sleutels",
        labels: { key: "Sleutel", lives: "staat hier", never: "nooit" },
        places: [
          { id: "env", name: ".env op de laptop" },
          { id: "vercel", name: "Instellingen van Vercel" },
          { id: "secrets", name: "Secrets van GitHub" },
          { id: "repo", name: "De repository", never: true },
          { id: "chat", name: "Een chat of bericht", never: true },
        ],
        keys: [
          {
            id: "model",
            name: "Modelsleutels",
            line: "Gemini en OpenAI, voor de beelden.",
            who: "IT geeft ze uit",
            at: 0,
          },
          {
            id: "connector",
            name: "Sleutels van de connector",
            line: "Aanmelding, GitHub App, handtekening.",
            who: "De beheerder",
            at: 1,
          },
          {
            id: "token",
            name: "Token van de triage",
            line: "Het Claude-token van de triage.",
            who: "De eigenaar, vanuit een terminal",
            at: 2,
          },
        ],
      },
    },

    /* ── 04 · Feedback ──────────────────────────────────────────────────── */
    {
      id: "feedback",
      kind: "guide",
      menuLabel: "Feedback",
      menuPrimary: true,
      head: {
        eyebrow: "04 · Feedback",
        title: { pre: "Hoe feedback bij", em: "de eigenaar komt." },
        sub: "Zo werkt het zodra de connector draait. Niemand heeft er een GitHub-account voor nodig.",
      },
      guide: {
        view: "pipeline",
        label: "Feedbacklus",
        labels: { person: "Een mens", machine: "Loopt vanzelf" },
        state: "Volgt",
        stations: [
          {
            id: "zeg",
            actor: "Iedereen bij Plopsa",
            by: "person",
            title: "Typt /skill-feedback",
            line: "Zegt wat er misging, en zegt ja.",
          },
          {
            id: "issue",
            actor: "Connector · Vercel",
            by: "machine",
            title: "Dient een issue in",
            line: "Gelijkaardige opmerkingen komen eerst.",
          },
          {
            id: "label",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Labelt het",
            line: "Leest ze naast de skill. Wijzigt niets.",
          },
          {
            id: "beslist",
            actor: "De eigenaar",
            by: "person",
            title: "Beslist",
            line: "Fixen, later, sluiten, of doorgeven.",
          },
          {
            id: "voorstel",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Stelt de fix voor",
            line: "De kleinste wijziging, met zijn test.",
          },
          {
            id: "samen",
            actor: "Een mens",
            by: "person",
            title: "Voegt samen",
            line: "De versie gaat omhoog.",
          },
        ],
        close:
          "Binnen 30 minuten bij iedereen. Tot de connector draait: zeg het ons, of open een pull request.",
      },
    },

    /* ── 05 · Close ─────────────────────────────────────────────────────── */
    {
      id: "meer",
      kind: "close",
      menuLabel: "Docs",
      head: {
        eyebrow: "05 · Docs",
        title: { pre: "Alle stappen staan in", em: "de repository." },
        sub: "docs/SETUP.md voor de plugins, docs/CHANGING-A-RULE.md voor een regel die anders moet.",
      },
      actions: [
        {
          id: "mail",
          label: "vince@thoughtform.co",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
      ],
      footerLine: "Thoughtform · Antwerpen · 2026",
      signature: "Vince Buyssens",
    },
  ],
};
