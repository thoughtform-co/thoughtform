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
    title: { pre: "Van de repository", em: "tot in ieders Claude." },
    lede: "De onderdelen, de stappen en wie ze zet, van de plugin tot de dienst die de sleutels bewaart en feedback doorstuurt.",
    actions: [
      { id: "start", label: "De stappen", href: "#stappen", primary: true },
      { id: "feedback", label: "Feedback", href: "#feedback" },
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
    title: "Plopsa · De setup in de praktijk",
    description:
      "Hoe Plopsa's Claude-plugins bij het team komen: de skills, de marketplace, GitHub, de sleutels, en de weg die een opmerking aflegt naar de eigenaar van een skill.",
  },
  sections: [
    /* ── 01 · Waarom ──────────────────────────────────────────────────── */
    {
      id: "waarom",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "01 · Waarom het zo gebouwd is",
      menuLabel: "Waarom",
      line: {
        pre: "De tools veranderen elke maand.",
        em: "Het oordeel blijft in jullie bestanden.",
      },
      subline:
        "Daarom draait de setup op Plopsa's eigen accounts, staat hij in gewone tekstbestanden, en wordt hij beter door wie hem gebruikt.",
    },

    /* ── 02 · De kaart: het systeem, en wat elk woord betekent ────────── */
    {
      id: "onderdelen",
      kind: "guide",
      menuLabel: "Onderdelen",
      menuPrimary: true,
      head: {
        eyebrow: "02 · De onderdelen",
        title: { pre: "Hoe het", em: "samenhangt." },
        sub: "De skills staan in GitHub. Claude brengt ze naar het team. Feedback komt terug via één kleine dienst op Vercel.",
      },
      guide: {
        view: "overview",
        repo: {
          label: "GitHub",
          name: "plopsa-ai-studio, privé",
          strata: [
            { tag: "Skill", name: "Een stuk werk, uitgeschreven" },
            { tag: "Plugins", name: "plopsa en creative" },
            { tag: "Marketplace", name: "De lijst die Claude leest" },
          ],
        },
        org: { label: "Claude", name: "De organisatie van Plopsa", sync: "Sync · 30 min" },
        surfaces: {
          label: "Het team",
          items: [
            { glyph: "C", name: "Chat" },
            { glyph: "D", name: "Desktop" },
            { glyph: "W", name: "Cowork" },
            { glyph: ">_", name: "Claude Code" },
          ],
        },
        service: {
          label: "Vercel",
          name: "Feedbackconnector",
          line: "/skill-feedback → issue → de eigenaar beslist",
          state: "Volgt",
        },
        columns: [
          {
            tab: "01 · GitHub",
            title: "Waar de skills staan.",
            line: "Een privé-repository, straks op Plopsa's eigen account. Elke wijziging is een pull request die een mens samenvoegt.",
          },
          {
            tab: "02 · Claude",
            title: "Hoe het bij het team komt.",
            line: "De Claude-organisatie haalt elke samengevoegde wijziging binnen 30 minuten op en installeert ze voor iedereen.",
          },
          {
            tab: "03 · Vercel",
            title: "Hoe het beter wordt.",
            line: "Een kleine connector maakt van een opmerking in de chat een GitHub-issue voor de eigenaar van de skill.",
          },
        ],
        foot: ["Van Plopsa", "Bijgehouden in GitHub", "Binnen 30 minuten bij iedereen"],
        alt: "Eén lijn loopt van de GitHub-repository, waar de skills in de plugins plopsa en creative in de marketplace plopsa-plugins zitten, naar de Claude-organisatie van Plopsa en waaiert uit naar het team in de chat, Desktop, Cowork en Claude Code. Een stippellijn loopt onderlangs terug via de feedbackconnector op Vercel, die nog volgt, naar de repository.",
      },
    },

    /* ── 03 · De stappen ───────────────────────────────────────────────── */
    {
      id: "stappen",
      kind: "guide",
      menuLabel: "De stappen",
      menuPrimary: true,
      head: {
        eyebrow: "03 · De stappen",
        title: { pre: "De setup,", em: "in volgorde." },
        sub: "Elke stap één keer, door de rol ernaast. Tot de koppeling er is, installeert het team de plugins als zip.",
      },
      guide: {
        view: "checklist",
        labels: { done: "klaar" },
        phases: [
          {
            id: "vooraf",
            label: "Vooraf",
            when: "IT, eenmalig",
            steps: [
              {
                id: "github-account",
                title: "Een GitHub-account voor Plopsa",
                line: "De repository verhuist erheen, met zijn geschiedenis.",
                href: "https://github.com/account/organizations/new",
              },
              {
                id: "model-keys",
                title: "De modelsleutels uitgeven",
                line: "Gemini en OpenAI, via de wachtwoordmanager.",
                href: "https://aistudio.google.com/apikey",
              },
            ],
          },
          {
            id: "koppelen",
            label: "Koppelen",
            when: "Een Claude-eigenaar, eenmalig",
            steps: [
              {
                id: "app",
                title: "De Claude GitHub App installeren",
                line: "Alleen op deze repository.",
                who: "GitHub-beheerder",
                href: "https://github.com/apps/claude",
              },
              {
                id: "sync",
                title: "De repository koppelen",
                line: "De eerste sync duurt tot 30 minuten.",
                href: "https://claude.ai/admin-settings/skills?tab=inventory",
              },
              {
                id: "default",
                title: "De plugins aan het team geven",
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
                line: "Twee kopieën van één skill botsen.",
                href: "https://claude.ai/admin-settings/skills",
              },
            ],
          },
          {
            id: "feedback-setup",
            label: "Feedback",
            when: "Later, IT met de beheerder",
            steps: [
              {
                id: "vercel",
                title: "Een Vercel Pro-team",
                line: "Daar draait de connector. Hobby is enkel persoonlijk.",
                href: "https://vercel.com/dashboard",
              },
              {
                id: "aanmelding",
                title: "Een project voor de aanmelding",
                line: "Zodat enkel Plopsa-accounts zich aanmelden.",
                href: "https://console.cloud.google.com/projectcreate",
              },
              {
                id: "connector",
                title: "De connector voor iedereen toevoegen",
                line: "Voor de hele organisatie, als laatste, na de test.",
                who: "Claude-eigenaar",
                href: "https://claude.ai/settings/connectors",
              },
            ],
          },
          {
            id: "daarna",
            label: "Daarna",
            when: "Bij elke wijziging",
            steps: [
              {
                id: "pr",
                title: "Een pull request openen",
                line: "Een GitHub Action verhoogt de versie.",
                who: "Iemand van het team",
                href: "https://github.com/thoughtform-co/plopsa-ai-studio/pulls",
              },
              {
                id: "merge",
                title: "Samenvoegen",
                line: "Binnen 30 minuten bij iedereen.",
                who: "Een mens",
                href: "https://github.com/thoughtform-co/plopsa-ai-studio/pulls",
              },
            ],
          },
        ],
      },
    },

    /* ── 04 · De sleutels ──────────────────────────────────────────────── */
    {
      id: "sleutels",
      kind: "guide",
      menuLabel: "De sleutels",
      menuPrimary: true,
      head: {
        eyebrow: "04 · De sleutels",
        title: { pre: "Waar elke", em: "sleutel staat." },
        sub: "Geen enkele sleutel staat ooit in de repository of in een chat. De skills lezen een sleutel bij naam en tonen hem nooit.",
      },
      guide: {
        view: "matrix",
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
            line: "Gemini en OpenAI, voor de beelden. De leverancier factureert per aanroep.",
            who: "IT geeft ze uit",
            at: 0,
          },
          {
            id: "connector",
            name: "Sleutels van de connector",
            line: "De aanmelding, de sleutel van de GitHub App, het geheim waarmee hij tekent.",
            who: "De beheerder, zodra hij draait",
            at: 1,
          },
          {
            id: "token",
            name: "Token van de triage",
            line: "Het Claude-token waarop de feedbacktriage draait.",
            who: "Wie het bezit, vanuit een terminal",
            at: 2,
          },
        ],
      },
    },

    /* ── 05 · Feedback (volgt) ─────────────────────────────────────────── */
    {
      id: "feedback",
      kind: "guide",
      menuLabel: "Feedback",
      menuPrimary: true,
      head: {
        eyebrow: "05 · Feedback",
        title: { pre: "Hoe een opmerking bij", em: "de eigenaar komt." },
        sub: "Zo werkt het zodra de connector bij Plopsa draait. Niemand heeft er een GitHub-account voor nodig.",
      },
      guide: {
        view: "pipeline",
        labels: { person: "Een mens", machine: "Loopt vanzelf" },
        state: "Volgt",
        stations: [
          {
            id: "zeg",
            actor: "Iedereen bij Plopsa",
            by: "person",
            title: "Typt /skill-feedback",
            line: "Zegt wat er misging, leest de exacte tekst, en zegt ja. Meldt zich één keer aan.",
          },
          {
            id: "issue",
            actor: "Connector · Vercel",
            by: "machine",
            title: "Dient een issue in",
            line: "Toont eerst gelijkaardige opmerkingen, zodat een herhaling als extra stem telt.",
          },
          {
            id: "label",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Labelt het",
            line: "Leest de opmerking naast de bestanden van de skill en reageert. Wijzigt geen bestand.",
          },
          {
            id: "beslist",
            actor: "De eigenaar",
            by: "person",
            title: "Beslist",
            line: "Fixen, later, sluiten, of doorsturen naar een developer.",
          },
          {
            id: "voorstel",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Stelt de fix voor",
            line: "De kleinste wijziging, met de test die de fout had gevangen.",
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
          "Claude zet de fix binnen 30 minuten bij iedereen. Tot de connector draait: zeg het tegen ons, of pas de regel aan via een pull request (docs/CHANGING-A-RULE.md).",
      },
    },

    /* ── 06 · Close ────────────────────────────────────────────────────── */
    {
      id: "meer",
      kind: "close",
      menuLabel: "Alle stappen",
      head: {
        eyebrow: "06 · Alle stappen",
        title: { pre: "Elke stap staat ook in", em: "de repository." },
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
