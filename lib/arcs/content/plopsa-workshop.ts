import type { ArcDef } from "../types";

/**
 * Plopsa, workshop III, as an arc: the page the room runs on Monday
 * 28 September 2026 and the handout it prints to.
 *
 * Thirteen beats, one idea per viewport, in the client's own language. The
 * first two workshops (30 July) were tool sessions; this one builds the
 * setup that makes their campaign visuals at volume, and hands it over as
 * a plugin their own Claude organisation installs.
 *
 * ⚠ IT OPENS ON THE FRAME BEFORE THE TOOL (ADR-130, owner 2026-09-27). Two
 * panels (what we covered, what we do today), then the Moira workshop's
 * argument in the house's own drawings: a prompt, a tool, an agent; the
 * curve; the question whether a workflow is for a person or an agent; the
 * horizon; one piece of work with six questions around it; and the rules as
 * the place the team has the most grip. It is the same workshop Loop gets,
 * with Plopsa's own examples.
 *
 * ⚠ IT IS THE CLIENT'S PAGE. It may name their parks, their campaign
 * families and the rule their designer gave; it prints no fee and no
 * fleet vocabulary. Their artwork is never shown; the pictures are the
 * plates the setup drew of their own places, and the templates read as a
 * layer tree.
 */
export const PLOPSA_WORKSHOP_ARC: ArcDef = {
  slug: "plopsa-workshop",
  format: "workshop",
  client: "plopsa",
  kind: "workshop",
  status: "running",
  // Filed the day the page was made (ADR-118); the workshop itself is 28 September, in the copy.
  date: "2026-09-26",
  cardTitle: "Plopsa · workshop III",
  cardLede:
    "De setup die jullie campagnebeelden tekent en opmaakt, en die jullie zelf draaien.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Plopsa · Workshop III · 28 september 2026",
    title: { pre: "Een setup die", em: "jullie beelden maakt." },
    lede: "Vandaag bouwen we hem op jullie eigen templates, en daarna draaien jullie hem zelf.",
    actions: [
      { id: "start", label: "Vandaag", href: "#vandaag", primary: true },
      { id: "live", label: "Live", href: "#live" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    /* The homepage's own key visual, delivered the landing's way (ADR-075):
       the gateway plate, theme-dependent, which earns the route its
       `HERO_ROUTES` row and drops the static preload. The curtain is
       declared, as on the proposals (ADR-078 U1). */
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "Plopsa · workshop III — Thoughtform",
    description:
      "Hoe de setup die Plopsa's campagnebeelden tekent in elkaar zit, en wie hem draait.",
  },
  sections: [
    {
      id: "vandaag",
      kind: "list-groups",
      menuLabel: "Vandaag",
      menuPrimary: true,
      layout: "readout",
      head: {
        eyebrow: "01 · Vandaag",
        title: { pre: "Vandaag bouwen we", em: "de setup eromheen." },
        sub: "In juli leerden jullie prompten en zetten we Claude op. Op 22 september vroegen jullie om visuals en ads aan de lopende band; dat is wat we vandaag opzetten.",
      },
      groups: [
        {
          id: "terugblik",
          label: "Terugblik",
          blurb: "Wat we zagen",
          items: [
            { id: "juli-1", tag: "30 juli · I", name: "Beeld en video in Krea, hands-on" },
            { id: "juli-2", tag: "30 juli · II", name: "Claude, en de eerste skills" },
            { id: "huiswerk", tag: "Huiswerk", name: "Eén skill per workflow" },
            { id: "vraag", tag: "22 sept", name: "Visuals en ads aan de lopende band" },
            { id: "templates", tag: "25 sept", name: "Zes templates en één copyregel" },
            { id: "wave", tag: "26 sept", name: "Eerste wave op jullie eigen plekken" },
          ],
          foot: {
            label: "Stand",
            lines: ["De skills staan er al. Vandaag komt de setup die ze draait."],
          },
        },
        {
          id: "vandaag",
          label: "Vandaag",
          blurb: "Wat we vandaag doen",
          items: [
            { id: "kader", tag: "Kader", name: "Prompt, tool, agent", href: "#drie-manieren" },
            {
              id: "configuratie",
              tag: "Configuratie",
              name: "Zes vragen, twee die jullie schrijven",
              href: "#de-configuratie",
            },
            {
              id: "template",
              tag: "Template",
              name: "Van één template naar elke taal",
              href: "#een-psd-ontleed",
            },
            { id: "loop", tag: "Loop", name: "Brief, wave, checks, en dan jij", href: "#de-loop" },
            { id: "live", tag: "Live", name: "Eén campagnefamilie, in het lokaal", href: "#live" },
            { id: "zelf", tag: "Zelf doen", name: "Een uur aan het stuur", href: "#zelf-doen" },
            { id: "it", tag: "IT", name: "De plugin en de sleutels", href: "#wat-it-installeert" },
          ],
          foot: {
            label: "Meenemen",
            lines: ["De setup als plugin in jullie Claude, op jullie sleutels."],
          },
        },
      ],
      /* The thing the record leads to and the day works on, drawn once between
         the two panels (ADR-130 U1): ONE template as an exploded axonometric
         stack. These are the real top-level layers of the Meta-ads template
         Bert sent on 25 September, top of the stack first, in the same
         vocabulary the `#een-psd-ontleed` beat already uses ("Plaat",
         "Tagline", "Vrije zone") — one word for one thing across the page.
         ⚠ NO FILENAME: it carries a year and a format, and every string in a
         record is scanned for digits. */
      exploded: {
        label: "Eén template, vijf lagen",
        layers: [
          { id: "zone", label: "Vrije zone", note: "Waar niets mag staan", dashed: true },
          { id: "tagline", label: "Tagline", note: "Tagline, datum of prijs, per taal" },
          { id: "logo", label: "Logo's", note: "Parklogo en campagnemerk" },
          { id: "schaduw", label: "Schaduw", note: "Wat de tekst leesbaar houdt" },
          { id: "plaat", label: "Plaat", note: "Wat de setup tekent" },
        ],
      },
    },
    {
      id: "drie-manieren",
      kind: "stages",
      menuLabel: "Drie manieren",
      menuPrimary: true,
      head: {
        eyebrow: "02 · Prompt, tool, agent",
        title: { pre: "Hoe lang iets draait", em: "zonder dat jij kijkt." },
        sub: "Toen was het één plaat per prompt, en elke plaat zelf nagekeken. Vandaag geven we de setup het doel en de checks, en kijken jullie de galerij na.",
      },
      axes: { time: "Hoe lang, zonder jou", work: "Hoeveel van het werk" },
      ends: { near: "minuten", far: "een halve dag", top: "alles" },
      stages: [
        {
          id: "prompt",
          label: "Een prompt",
          name: "Vraag, en kijk na",
          body: "Eén plaat per prompt, en elke plaat zelf nagekeken.",
        },
        {
          id: "tool",
          label: "Een tool",
          name: "Jij bedient het",
          body: "De visuals-skill en de composite die logo, tagline en datum uit jullie bestanden zet. Jij drukt op de knop en kijkt na.",
        },
        {
          id: "agent",
          label: "Een agent",
          name: "Het draait de loop",
          body: "Brief, wave, drie grades, pick en de composite in elk formaat, terwijl de designers de galerij beoordelen.",
          lit: true,
        },
      ],
    },
    {
      id: "de-curve",
      kind: "curve",
      menuLabel: "De curve",
      head: {
        eyebrow: "03 · De curve",
        title: { pre: "Waarom lang werk", em: "nu pas lukt." },
        sub: "Elke release maakt minder kleine fouten. En een taak van uren is honderd kleine stappen achter elkaar, dus elke fout minder telt door tot het einde.",
      },
      years: ["2023", "2024", "2025", "2026"],
      now: "Nu",
      treads: ["minuten", "een kwartier", "een uur", "een halve dag"],
      axis: { y: "Taaklengte", along: "Elke zeven maanden twee keer zo lang" },
      reference: { label: "Een campagnefamilie door de loop", tread: 3 },
      note: "Bron: METR. De taak die een agent in de helft van de gevallen afwerkt, verdubbelt ongeveer elke zeven maanden. Deze tekening is een beeld van die vaststelling; ze meet geen modellen.",
    },
    {
      id: "mens-of-agent",
      kind: "interstitial",
      variant: "question",
      eyebrow: "04 · De vraag",
      line: {
        pre: "Bouw je een workflow voor een mens,",
        em: "of voor een agent?",
      },
      subline:
        "Voor een mens teken je elke stap uit; voor een agent schrijf je op wat goed is, en laat je de stappen aan hem. Dat tweede schrijven we vandaag samen op.",
    },
    {
      id: "de-horizon",
      kind: "horizon",
      menuLabel: "De horizon",
      head: {
        eyebrow: "05 · De poorten",
        title: { pre: "Waar de agent", em: "vanzelf stopt." },
        sub: "Slim genoeg is hij intussen wel. Wat hij niet heeft is jullie oordeel; daarom zetten we dat als poorten in de loop.",
      },
      axis: { from: "vijf minuten", to: "een halve dag" },
      operated: {
        label: "Een tool die je bedient",
        check: "jij kijkt na",
        steps: 8,
        line: "Jij kijkt na elke stap, acht keer op rij.",
      },
      agent: {
        label: "Een agent op een lange taak",
        start: "Jij zet het doel en de checks",
        gates: [
          { kind: "check", at: 0.27, label: "Checkt zijn eigen werk" },
          { kind: "retry", at: 0.52, label: "Stapt terug en tekent opnieuw" },
          { kind: "ask", at: 0.77, label: "Stopt en vraagt het jou" },
        ],
        end: "Jij beoordeelt het resultaat",
      },
      note: "Deze drie poorten zijn jullie loop: de grader leest elke plaat drie keer, een retry laat ze opnieuw tekenen, en in de galerij kiezen de designers.",
    },
    {
      id: "de-configuratie",
      kind: "questions",
      menuLabel: "De configuratie",
      menuPrimary: true,
      head: {
        eyebrow: "06 · Zes vragen",
        title: { pre: "De configuratie", em: "van één campagnefamilie." },
        sub: "Zes antwoorden per stuk werk. Vier kiezen wij voor iedereen; de context en de checks komen van het team dat het werk doet.",
      },
      work: {
        label: "Het werk",
        name: "Een campagnefamilie",
        line: "Eén template, vijf plekken, drie soorten platen.",
        image: {
          src: "/arcs/plopsa/plate-village-wide.webp",
          alt: "Een gegenereerde brede plaat van Plopsaland Village",
        },
        bar: {
          label: "Goed ziet eruit als",
          line: "Een plaat die een vreemde meteen herkent.",
        },
      },
      left: [
        {
          id: "model",
          title: "Het model",
          question: "Wat het draait",
          answer: "Nano Banana Pro en GPT Image, op jullie eigen sleutels.",
        },
        {
          id: "context",
          title: "De context",
          question: "Wat het weet",
          answer: "Elke plek met een foto, de templates, de copyregel.",
          lit: true,
        },
        {
          id: "evaluaties",
          title: "De evaluaties",
          question: "Hoe we het nakijken",
          answer: "Achtentwintig checks, elk één zin.",
          lit: true,
        },
      ],
      right: [
        {
          id: "data",
          title: "De data",
          question: "Wat het bereikt",
          answer: "De Drive met foto's, templates en logo's.",
        },
        {
          id: "interface",
          title: "De interface",
          question: "Waar jullie het openen",
          answer: "Claude met de plugin, en de galerij waar jullie kiezen.",
        },
        {
          id: "eigenaar",
          title: "De eigenaar",
          question: "Wie ervoor instaat",
          answer: "De designers op elk beeld, content op elke caption.",
          human: true,
        },
      ],
      tag: "Van jullie",
      alt: "Eén stuk werk in het midden, zes vragen eromheen, elk met het antwoord van Plopsa.",
    },
    {
      id: "de-regels",
      kind: "list-groups",
      menuLabel: "De regels",
      layout: "plates",
      head: {
        eyebrow: "07 · De regels",
        title: { pre: "De regels die", em: "alleen van jullie komen." },
        sub: "Deze regels komen uit jullie eigen bestanden en uit de mail van Bert. Elke regel hieronder is ook een check die de grader leest.",
      },
      groups: [
        {
          id: "beeld",
          label: "Beeld",
          blurb: "Wat een plaat mag zijn",
          items: [
            {
              id: "plek",
              tag: "GATE",
              name: "De plek zoals ze bestaat",
              body: "Een attractie of gebouw verschijnt alleen zoals het gebouwd is, met een foto als referentie. Zonder foto tekent hij niets.",
            },
            {
              id: "schoon",
              tag: "GATE",
              name: "Schone plaat",
              body: "Geen tekst, geen logo, geen badge, geen call to action in het beeld. Dat komt uit het bestand, in de composite.",
            },
            {
              id: "figuur",
              tag: "GATE",
              name: "Geen figuur",
              body: "Geen Studio 100-figuur, geen mascotte, geen kostuum. Die worden geplaatst uit het officiële materiaal.",
            },
          ],
          foot: { label: "Faalt", lines: ["Het beeld wordt niet bewaard en gaat opnieuw de wave in."] },
        },
        {
          id: "copy",
          label: "Copy",
          blurb: "Wat onder een beeld mag staan",
          items: [
            {
              id: "cta",
              tag: "REGEL",
              name: "Geen call to action op kindercontent",
              body: "Alle content met een Studio 100-figuur, op foto of video, ook een K3-show. Geen Beleef, Ontdek, Ga mee, Zien we jullie daar.",
            },
            {
              id: "info",
              tag: "OK",
              name: "Datum, plaats en prijs",
              body: "Van 17 oktober tot en met 8 november staat er gewoon. Het wordt pas een call to action als je erbij vraagt om te komen.",
            },
            {
              id: "vraag",
              tag: "TWIJFEL",
              name: "Tag iemand, swipe, wie",
              body: "Jullie eigen posts doen het. Of dat als call to action geldt, beslissen jullie vandaag; tot dan meldt de check het als twijfel.",
            },
          ],
          foot: { label: "Faalt", lines: ["De composite schrijft het bestand niet weg."] },
        },
        {
          id: "merk",
          label: "Merk",
          blurb: "Wat de composite zelf doet",
          items: [
            {
              id: "logo",
              tag: "CODE",
              name: "Logo per park, op contrast",
              body: "Wit op foto, parkkleur op crème, zwart waar de parkkleur wegvalt. Het komt uit het bestand en wordt nooit hertekend.",
            },
            {
              id: "zone",
              tag: "CODE",
              name: "De vrije zone",
              body: "Boven 30 procent bij een staand beeld, links 45 procent bij een liggend beeld. De veiligheidszone in jullie template bepaalt het.",
            },
            {
              id: "font",
              tag: "CODE",
              name: "Semplicita en Proxima Nova",
              body: "Uit de licentie op de laptop. Zonder licentie zet de composite een vervangend lettertype, en dat zie je meteen.",
            },
          ],
          foot: {
            label: "Levert",
            lines: ["Elk formaat, elke taal, elk park, uit één goedgekeurde plaat."],
          },
        },
      ],
    },
    {
      id: "een-psd-ontleed",
      kind: "flow",
      menuLabel: "De template",
      menuPrimary: true,
      head: {
        eyebrow: "08 · Een template ontleed",
        title: { pre: "Hoe de code", em: "de rest eromheen zet." },
        sub: "In alle zes de templates die jullie stuurden zit dezelfde opbouw. De setup tekent de plaat; de code zet het logo, de tagline en de datum erover, per taal en per formaat.",
      },
      brief: {
        label: "De template",
        fields: [
          "Plaat",
          "Parklogo",
          "Campagnemerk",
          "Tagline",
          "Datum",
          "Prijs",
          "Taal",
          "Vrije zone",
        ],
      },
      renders: {
        label: "Wat de setup tekent",
        images: [
          {
            src: "/arcs/plopsa/plate-chalet-tall.webp",
            alt: "Een gegenereerde plaat van een Studio 100-chalet",
          },
          {
            src: "/arcs/plopsa/plate-smurfendorp-tall.webp",
            alt: "Een gegenereerde plaat van het smurfendorp",
          },
          {
            src: "/arcs/plopsa/plate-hotel-tall.webp",
            alt: "Een gegenereerde plaat van het Theater Hotel",
          },
        ],
      },
      scale: {
        label: "Elke taal",
        markets: ["NL", "FR", "DE", "EN"],
      },
      steps: ["Tekenen", "Opmaken"],
    },
    {
      id: "de-loop",
      kind: "list-groups",
      menuLabel: "De loop",
      layout: "columns",
      head: {
        eyebrow: "09 · De loop",
        title: { pre: "De loop die", em: "jullie straks zelf draaien." },
        sub: "We draaien hem vandaag op de chalets, de hospitality-familie. Wij zetten hem op en draaien mee tot jullie hem zonder ons draaien.",
      },
      groups: [
        {
          id: "run",
          label: "De loop, op één familie",
          blurb: "De hospitality-familie, de chalets. Elke andere familie draait op dezelfde loop.",
          items: [
            {
              id: "brief",
              tag: "Brief",
              name: "De plek, het type, het seizoen",
              body: "Eén regel in de brief. De foto van de plek gaat altijd eerst mee als referentie.",
            },
            {
              id: "wave",
              tag: "Wave",
              name: "Twee versies per slot",
              body: "Vijf plekken, drie soorten platen, dertig beelden in één run.",
            },
            {
              id: "checks",
              tag: "Checks",
              name: "Drie keer gegradeerd",
              body: "Achtentwintig checks, elke plaat drie keer gelezen. De grader adviseert; beslissen doen jullie.",
            },
            {
              id: "compositie",
              tag: "Compositie",
              name: "Logo, tagline en datum, in elk formaat",
              body: "Uit jullie eigen bestanden. Op kindercontent weigert ze een call to action.",
            },
          ],
        },
        {
          id: "mensen",
          label: "Wie beslist, en waar",
          blurb: "Wie op welke stap de laatste poort is.",
          items: [
            {
              id: "designers",
              tag: "Plopsa",
              name: "De designers, de laatste poort op elk beeld",
              body: "Kiezen in de galerij en zeggen waarom. Wat twee keer gezegd wordt, wordt een check.",
              meta: "Elke wave",
            },
            {
              id: "content",
              tag: "Plopsa",
              name: "Content, op elke caption",
              body: "Beslist over de copyregel en de call to action per funnelstap.",
              meta: "Elke campagne",
            },
            {
              id: "it",
              tag: "Plopsa",
              name: "IT, op de plugin en de sleutels",
              body: "Installeert de plugin voor het team en beheert de twee API-sleutels.",
              meta: "Eén keer, dan per release",
            },
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, op de setup en de checks",
              body: "Zet de loop op en schrijft mee wat jullie terugsturen. Tegen week vier kijkt hij toe.",
              meta: "Vier weken",
            },
          ],
        },
      ],
    },
    {
      id: "live",
      kind: "cards",
      menuLabel: "Live",
      menuPrimary: true,
      // Two, not three: at the room's 1280 the house grid is two columns,
      // and a third card would sit alone under the fold.
      columns: 2,
      head: {
        eyebrow: "10 · Live, in het lokaal",
        title: { pre: "Eén campagnefamilie", em: "door de loop." },
        sub: "Twintig minuten, van de brief tot de opgemaakte bestanden. Dit zijn twee platen uit de eerste wave, getekend op jullie eigen foto's.",
      },
      cards: [
        {
          id: "heidi",
          n: "01",
          kicker: "Brede plaat",
          image: {
            src: "/arcs/plopsa/plate-heidi-wide.webp",
            alt: "Een gegenereerde brede plaat van Heidi The Ride",
          },
          title: "Heidi The Ride",
          body: "De houten structuur en de afdaling zoals op de foto. Links rust voor het merk en de titel.",
          metaRows: [
            { label: "Oordeel", value: "Pass, twee van drie runs" },
            { label: "Model", value: "Nano Banana Pro" },
          ],
        },
        {
          id: "chalet",
          n: "02",
          kicker: "Brede plaat",
          image: {
            src: "/arcs/plopsa/plate-chalet-wide.webp",
            alt: "Een gegenereerde brede plaat van een Studio 100-chalet",
          },
          title: "Studio 100 Chalets",
          body: "De blauwe planken en de luiken met het hart. De familie die we vandaag live doorlopen.",
          metaRows: [
            { label: "Oordeel", value: "Pass, twee van drie runs" },
            { label: "Model", value: "Nano Banana Pro" },
          ],
        },
      ],
    },
    {
      id: "zelf-doen",
      kind: "cards",
      menuLabel: "Zelf doen",
      columns: 4,
      head: {
        eyebrow: "11 · Zelf doen",
        title: { pre: "Een uur", em: "aan het stuur." },
        sub: "Vier oefeningen op jullie eigen bestanden. Wat je schrijft blijft in de setup staan, ook na vandaag.",
      },
      cards: [
        {
          id: "check",
          n: "01",
          kicker: "15 min",
          title: "Schrijf één check",
          body: "Kies een fout die je in juli zag. Schrijf in één zin op wat er mis mee is. De grader leest die zin bij de volgende wave.",
        },
        {
          id: "wave",
          n: "02",
          kicker: "15 min",
          title: "Draai één wave",
          body: "Kies een plek en een type, twee draws. Kijk naar de sheet vóór je naar een beeld kijkt.",
        },
        {
          id: "verdict",
          n: "03",
          kicker: "15 min",
          title: "Decodeer één verdict",
          body: "Zeg wat je van een plaat vindt, in je eigen woorden. Wij schrijven mee terwijl je het zegt.",
        },
        {
          id: "copy",
          n: "04",
          kicker: "15 min",
          title: "Kijk één caption na",
          body: "Schrijf een caption voor een K3-post en laat de copycheck erover gaan. Herschrijf tot het door is.",
        },
      ],
    },
    {
      id: "wat-it-installeert",
      kind: "cards",
      menuLabel: "IT",
      columns: 3,
      head: {
        eyebrow: "12 · Voor IT",
        title: { pre: "Wat IT moet", em: "aanzetten." },
        sub: "Alles staat op naam van Plopsa. Vandaag installeren we de plugin als zip; na het gesprek met IT haalt hij zichzelf op uit GitHub.",
      },
      cards: [
        {
          id: "plugin",
          n: "01",
          kicker: "Claude Team",
          title: "De plugin",
          body: "Organisatie-instellingen, Plugins en skills, Toevoegen. Vandaag als zip per persoon; daarna als GitHub-repository die vanzelf bijwerkt, en Installed by default voor het team.",
        },
        {
          id: "github",
          n: "02",
          kicker: "GitHub",
          title: "Een eigen account",
          body: "De repository met de plugins staat privé onder een account van Plopsa, zodat de Claude-beheerder hem kan koppelen. Tot dan staat hij bij ons.",
        },
        {
          id: "keys",
          n: "03",
          kicker: "Sleutels",
          title: "Twee API-sleutels",
          body: "Een Gemini-sleutel en een OpenAI-sleutel op naam van Plopsa, in een .env op de laptop die waves draait. Nooit in de repository. De leverancier factureert per aanroep.",
        },
      ],
      /* The 22 September question (Krea's node canvas, or a setup of their
         own) had a beat of its own until ADR-130; the frame now carries the
         argument, so the practical answer rides here as one tip. */
      tips: [
        {
          id: "krea",
          tag: "TIP · KREA",
          body: "Krea erbij houden kan, als extra tabblad. Het verschil zit in waar jullie oordeel terechtkomt, in hun account of in jullie eigen bestanden, en in de prijs per aanroep: op jullie eigen sleutel één cent, achter een wrapper vijf.",
        },
      ],
      footnote: "De volledige stappen staan in docs/SETUP.md in de repository.",
    },
    {
      id: "wat-volgt",
      kind: "close",
      menuLabel: "Wat volgt",
      head: {
        eyebrow: "13 · Wat volgt",
        title: { pre: "Daarna draait het", em: "bij jullie." },
        sub: "De eerste week gaat de eerste campagne door de loop, met de designers aan de knoppen. Daarna komen de copy en de campagneteams erbij, dan de tweede familie met de checks die er intussen bij staan. In week vier dragen we over, met een datum erop; een maand en drie maanden later komen we nog eens kijken.",
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
