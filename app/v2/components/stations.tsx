/* eslint-disable @next/next/no-img-element */

/* ═══════════════════════════════════════════════════════════════════
   01 HERO
   ═══════════════════════════════════════════════════════════════════ */
export function HeroStation() {
  return (
    <section className="station hero" id="hero" data-station="hero">
      <div className="hero__content">
        <div className="hero__wordmark">
          <img src="/logos/Thoughtform_Wordmark_Lockup-Vertical.svg" alt="Thoughtform" />
        </div>
        <p className="hero__tagline">
          The interface for navigating <em>human–AI collaboration.</em>
        </p>
        <p className="hero__desc">
          AI isn&apos;t software to command. It&apos;s a strange intelligence to navigate — a
          geometry of meaning compressed from everything we&apos;ve written, said, and made.
          Thoughtform is the instrument deck.
        </p>
        <div className="hero__cta">
          <a href="#practice" className="btn btn--solid">
            Begin navigation
            <span className="arrow" />
          </a>
          <a href="#services" className="btn">
            See services
          </a>
        </div>
        <div className="hero__meta">
          <div className="readout">
            <span className="l">Phonetic</span>
            <span className="v">θɔːtfɔːrm · THAWT-form</span>
          </div>
          <div className="readout">
            <span className="l">Landmark</span>
            <span className="v">Origin · entry vector</span>
          </div>
          <div className="readout">
            <span className="l">Build</span>
            <span className="v">2026.04 · v2</span>
          </div>
        </div>
      </div>

      <div className="hero__viz">
        <div className="hero__viz__frame">
          <span className="br" />
          <span className="bl" />
        </div>
        <div className="hero__viz__label">Gateway · Three.js mount</div>
        <div className="hero__viz__readout">0.00 / 1.00 · stable</div>
        <div className="hero__viz__scanline" />
        <div className="gateway-viz">
          <svg viewBox="-200 -200 400 400">
            <g fill="none" strokeWidth="0.7">
              <circle
                className="ring-a"
                r="180"
                stroke="var(--gold)"
                strokeOpacity="0.15"
                strokeDasharray="2 4"
              />
              <circle
                className="ring-a"
                r="150"
                stroke="var(--gold)"
                strokeOpacity="0.22"
                strokeDasharray="1 3"
              />
              <g
                style={{
                  transformOrigin: "0 0",
                  animation: "v2-rotate 120s linear infinite",
                }}
              >
                <circle
                  className="ring-b"
                  r="120"
                  stroke="var(--gold)"
                  strokeOpacity="0.35"
                  strokeDasharray="4 8"
                />
                <circle r="4" cx="120" cy="0" fill="var(--gold)" />
              </g>
              <g
                style={{
                  transformOrigin: "0 0",
                  animation: "v2-rotateRev 90s linear infinite",
                }}
              >
                <circle
                  className="ring-a"
                  r="90"
                  stroke="var(--dawn)"
                  strokeOpacity="0.18"
                  strokeDasharray="2 6"
                />
                <circle r="3" cx="-90" cy="0" fill="var(--dawn)" fillOpacity="0.6" />
              </g>
              <circle
                className="ring-b"
                r="60"
                stroke="var(--gold)"
                strokeOpacity="0.5"
                strokeDasharray="6 4"
              />
              <circle r="30" stroke="var(--dawn)" strokeOpacity="0.35" />
              <path
                d="M-180 0 L-40 0 M40 0 L180 0 M0 -180 L0 -40 M0 40 L0 180"
                stroke="var(--dawn)"
                strokeOpacity="0.15"
                strokeWidth="0.5"
              />
              <path d="M0 -15 L15 0 L0 15 L-15 0 Z" fill="var(--gold)" opacity="0.7" />
            </g>
            <g
              fontFamily="var(--font-pt-mono)"
              fontSize="8"
              fill="var(--dawn)"
              opacity="0.4"
              textAnchor="middle"
            >
              <text x="0" y="-170">
                N 000
              </text>
              <text x="170" y="4" textAnchor="start">
                090
              </text>
              <text x="0" y="182">
                180
              </text>
              <text x="-170" y="4" textAnchor="end">
                270
              </text>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   02 DEFINITION
   ═══════════════════════════════════════════════════════════════════ */
export function DefinitionStation() {
  return (
    <section className="station" id="definition" data-station="definition">
      <div className="station__idx">
        Section 02 · Definition
        <span className="landmark">Landmark · polar coordinates / semantic orbit</span>
      </div>
      <h2 className="station__title">
        Thoughtform is
        <br />
        the <em>interface.</em>
      </h2>
      <p className="station__lede">
        Most companies struggle with AI because they treat it like normal software. But AI
        isn&apos;t a tool to command — it&apos;s a new intelligence we must learn to navigate. This
        is the grammar for that navigation.
      </p>

      <div className="def">
        <aside className="def__aside">
          <div className="def__dict">
            <span className="word">Thoughtform</span>
            <span className="ipa">/ θɔːtfɔːrm / THAWT-form</span>
            <p>
              <span className="pos">n.</span> a form taken by thought; specifically, an{" "}
              <em style={{ color: "var(--gold)", fontStyle: "normal" }}>interface</em> through which
              abstract intelligence becomes legible, navigable, instrumented.
            </p>
            <p style={{ marginTop: 12 }}>
              <span className="pos">v.</span> to give shape to latent meaning; to make navigation
              possible where before there was only vector space.
            </p>
          </div>
        </aside>

        <div className="spectrum">
          <div className="spectrum__rail" />
          <div className="spectrum__dot" aria-hidden="true" />

          <div className="spectrum__point">
            <div className="l">Tool</div>
            <h3>Executes commands</h3>
            <p>
              Predictable. You provide the thinking. The intelligence lives on your side of the
              interface.
            </p>
          </div>

          <div className="spectrum__point spectrum__point--mid">
            <div className="l">AI lives here</div>
            <h3>
              Neither pure tool
              <br />
              nor true collaborator
            </h3>
            <p>
              Always <em>both.</em> The ratio shifts with every interaction — every prompt relocates
              the dot along the rail.
            </p>
          </div>

          <div className="spectrum__point spectrum__point--end">
            <div className="l">Collaborator</div>
            <h3>Interprets intent</h3>
            <p>
              Surprising. You provide direction and judgment. The intelligence meets you in the
              middle of the sentence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   03 PRACTICE
   ═══════════════════════════════════════════════════════════════════ */
export function PracticeStation() {
  return (
    <section className="station" id="practice" data-station="practice">
      <div className="station__idx">
        Section 03 · Thoughtform in Practice
        <span className="landmark">Landmark · continuum drift / story field</span>
      </div>
      <h2 className="station__title">
        Adopt. <em>Encode.</em>
        <br />
        Build.
      </h2>
      <p className="station__lede">
        Navigation is the skill that runs through all of it. Each phase creates the conditions for
        the next. Here&apos;s what that looks like — with the receipts.
      </p>

      <div className="practice">
        {/* 01 ADOPT */}
        <div className="phase">
          <div className="phase__text">
            <div className="phase__head">
              <span className="phase__num">01</span>
              <span className="phase__name">Adopt</span>
              <span className="phase__meta">Phase · see</span>
            </div>
            <p>
              Give people capable tools and show them what AI actually is. Not a rollout. Not a
              mandate. Show the work, let the momentum build <em>organically.</em>
            </p>
            <p>
              The gap isn&apos;t access. It&apos;s knowing how to explain your work to AI the way
              you&apos;d explain it to a brilliant colleague.
            </p>
          </div>
          <div className="case">
            <span className="br" />
            <span className="bl" />
            <div className="case__label">At Loop Earplugs</div>
            <h4>AI across creative production</h4>
            <p>
              AI now touches every stage of how the Studio team works. AI generates scene-based
              imagery. A separate model handles product placement. Humans steer concept, curate
              output, and design the final ad.
            </p>
            <div className="case__stats">
              <div>
                <div className="case__stat-v">90%</div>
                <div className="case__stat-l">
                  Of briefings
                  <br />
                  AI-assisted
                </div>
              </div>
              <div>
                <div className="case__stat-v">6.1×</div>
                <div className="case__stat-l">
                  ROAS on navigated
                  <br />
                  campaigns
                </div>
              </div>
              <div>
                <div className="case__stat-v">5 → 69</div>
                <div className="case__stat-l">
                  Claude seats,
                  <br />
                  organic growth
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 02 ENCODE */}
        <div className="phase is-reverse">
          <div className="phase__text">
            <div className="phase__head">
              <span className="phase__num">02</span>
              <span className="phase__name">Encode</span>
              <span className="phase__meta">Phase · crystallize</span>
            </div>
            <p>
              Individual knowledge compounds, but it lives in people&apos;s heads. Build AI Skills
              that <em>encode</em> brand voice, copy rules, and domain knowledge into reusable
              packages.
            </p>
            <p>Knowledge transfers. People don&apos;t have to.</p>
          </div>
          <div className="case">
            <span className="br" />
            <span className="bl" />
            <div className="case__label">At Loop Earplugs</div>
            <h4>Individual knowledge as organizational capability</h4>
            <p>
              Skills encode what teams know: brand voice rules, 295 real ad examples, marketplace
              conventions, legal frameworks. Five teams now actively building and sharing their own
              Skills.
            </p>
            <div className="case__stats is-two">
              <div>
                <div className="case__stat-v">10+</div>
                <div className="case__stat-l">
                  AI Skills encoding
                  <br />
                  institutional knowledge
                </div>
              </div>
              <div>
                <div className="case__stat-v">5</div>
                <div className="case__stat-l">
                  Teams building
                  <br />
                  their own Skills
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 03 BUILD */}
        <div className="phase">
          <div className="phase__text">
            <div className="phase__head">
              <span className="phase__num">03</span>
              <span className="phase__name">Build</span>
              <span className="phase__meta">Phase · ship</span>
            </div>
            <p>
              Encoded knowledge reveals which workflows should become software. Too specific to buy
              off the shelf. Too small to outsource. Built by domain experts with AI, in{" "}
              <em>days instead of months.</em>
            </p>
            <p>
              From using technology to create creative work — to using creative thinking to build
              technology.
            </p>
          </div>
          <div className="case">
            <span className="br" />
            <span className="bl" />
            <div className="case__label">At Loop Earplugs</div>
            <h4>Production tools built by a team of one</h4>
            <p>
              An internal image and video generation platform with full cost transparency. A
              workflow orchestration layer. A briefing agent fed by first-party data. Each started
              as a prototype.
            </p>
            <div className="case__stats">
              <div>
                <div className="case__stat-v">6+</div>
                <div className="case__stat-l">
                  Production tools
                  <br />
                  built internally
                </div>
              </div>
              <div>
                <div className="case__stat-v">Days</div>
                <div className="case__stat-l">
                  From friction
                  <br />
                  to prototype
                </div>
              </div>
              <div>
                <div className="case__stat-v">1</div>
                <div className="case__stat-l">
                  Domain expert
                  <br />
                  as builder
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   04 SERVICES
   ═══════════════════════════════════════════════════════════════════ */
export function ServicesStation() {
  return (
    <section className="station" id="services" data-station="services">
      <div className="station__idx">
        Section 04 · Services
        <span className="landmark">Landmark · trajectory grid / vanishing point</span>
      </div>
      <h2 className="station__title">
        Navigation
        <br />
        <em>training.</em>
      </h2>
      <p className="station__lede">
        We teach teams to think <em style={{ color: "var(--gold)", fontStyle: "normal" }}>with</em>{" "}
        AI, not at it — so strangeness becomes a creative instrument rather than a hazard.
      </p>

      <div className="services__deck">
        <div className="service-card">
          <span className="br" />
          <span className="bl" />
          <div className="service-card__id">SVC · 01</div>
          <div className="service-card__sigil">
            <svg viewBox="-50 -50 100 100" fill="none">
              <circle
                r="42"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 3"
                opacity="0.5"
              />
              <circle r="28" stroke="currentColor" strokeWidth="0.8" />
              <circle r="14" stroke="currentColor" strokeWidth="1" />
              <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill="currentColor" />
              <path d="M0 -42 L0 -28 M0 28 L0 42 M-42 0 L-28 0 M28 0 L42 0" stroke="currentColor" />
            </svg>
          </div>
          <h3 className="service-card__title">AI Intuition Workshops</h3>
          <p className="service-card__desc">
            Develop the mental models that unlock creative collaboration with AI. Live sessions — 2
            to 5 days — for creative and strategy teams.
          </p>
          <div className="service-card__foot">
            <span>from · 2 days</span>
            <span className="arrow">→</span>
          </div>
        </div>

        <div className="service-card">
          <span className="br" />
          <span className="bl" />
          <div className="service-card__id">SVC · 02</div>
          <div className="service-card__sigil">
            <svg viewBox="-50 -50 100 100" fill="none">
              <rect
                x="-38"
                y="-38"
                width="76"
                height="76"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <rect
                x="-26"
                y="-26"
                width="52"
                height="52"
                stroke="currentColor"
                strokeWidth="0.8"
                transform="rotate(45)"
              />
              <path
                d="M-14 0 L0 -14 L14 0 L0 14 Z"
                stroke="currentColor"
                fill="none"
                strokeWidth="1"
              />
              <circle r="3" fill="currentColor" />
              <path
                d="M-38 -38 L-30 -38 M-38 -38 L-38 -30 M38 38 L30 38 M38 38 L38 30"
                stroke="currentColor"
              />
            </svg>
          </div>
          <h3 className="service-card__title">Strategic Integration</h3>
          <p className="service-card__desc">
            Design AI-augmented workflows for creative and strategic teams. Systems, rituals,
            handoffs — calibrated to your actual work.
          </p>
          <div className="service-card__foot">
            <span>engagement · ongoing</span>
            <span className="arrow">→</span>
          </div>
        </div>

        <div className="service-card">
          <span className="br" />
          <span className="bl" />
          <div className="service-card__id">SVC · 03</div>
          <div className="service-card__sigil">
            <svg viewBox="-50 -50 100 100" fill="none">
              <path
                d="M-42 20 L0 -30 L42 20 Z"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <path d="M-28 14 L0 -20 L28 14 Z" stroke="currentColor" strokeWidth="0.8" />
              <path
                d="M0 -20 L0 20 M-14 0 L14 0"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.6"
              />
              <circle cx="0" cy="-20" r="4" fill="currentColor" />
              <circle cx="-28" cy="14" r="2" fill="currentColor" opacity="0.7" />
              <circle cx="28" cy="14" r="2" fill="currentColor" opacity="0.7" />
            </svg>
          </div>
          <h3 className="service-card__title">Custom Expeditions</h3>
          <p className="service-card__desc">
            Guided exploration of AI capabilities tailored to your domain — R&amp;D sprints where we
            chart the territory alongside your team.
          </p>
          <div className="service-card__foot">
            <span>scoped · 4–12 weeks</span>
            <span className="arrow">→</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   05 PRODUCTS
   ═══════════════════════════════════════════════════════════════════ */
export function ProductsStation() {
  return (
    <section className="station" id="products" data-station="products">
      <div className="station__idx">
        Section 05 · Products
        <span className="landmark">Landmark · instrument constellation</span>
      </div>
      <h2 className="station__title">
        Instruments
        <br />
        in the <em>deck.</em>
      </h2>
      <p className="station__lede">
        Our own interfaces for navigating latent space — quiet tools, built for practitioners. Each
        is a lens on a different axis of the work.
      </p>

      <div className="products">
        <div className="product-cell">
          <div className="product-cell__head">
            <span className="product-cell__tag">Astrolabe</span>
            <span className="product-cell__status">Live · beta</span>
          </div>
          <h3 className="product-cell__name">Astrolabe</h3>
          <p className="product-cell__desc">
            Between algorithm and insight, navigation is what remains. A workbench for semantic
            exploration — reference, style, strategy, all in one frame.
          </p>
          <div className="product-cell__foot">
            <span>thoughtform.co/astrolabe</span>
            <span>→</span>
          </div>
        </div>

        <div className="product-cell">
          <div className="product-cell__head">
            <span className="product-cell__tag">Atlas</span>
            <span className="product-cell__status">Live · beta</span>
          </div>
          <h3 className="product-cell__name">Atlas</h3>
          <p className="product-cell__desc">
            A catalogue of beings that dwell where meaning bleeds into geometry. Name the creatures
            of latent space so you can work with them.
          </p>
          <div className="product-cell__foot">
            <span>thoughtform.co/atlas</span>
            <span>→</span>
          </div>
        </div>

        <div className="product-cell">
          <div className="product-cell__head">
            <span className="product-cell__tag">Sigil</span>
            <span className="product-cell__status product-cell__status--wip">Preview</span>
          </div>
          <h3 className="product-cell__name">Sigil</h3>
          <p className="product-cell__desc">
            Render identity as geometry. Particle marks and service crests that feel hand-drawn by
            the system itself.
          </p>
          <div className="product-cell__foot">
            <span>thoughtform.co/sigil</span>
            <span>→</span>
          </div>
        </div>

        <div className="product-cell">
          <div className="product-cell__head">
            <span className="product-cell__tag">Sybil</span>
            <span className="product-cell__status product-cell__status--wip">In forge</span>
          </div>
          <h3 className="product-cell__name">Sybil</h3>
          <p className="product-cell__desc">
            She reads the schedules of mortals and whispers what approaches. Ambient intelligence
            for teams who share a calendar with the future.
          </p>
          <div className="product-cell__foot">
            <span>thoughtform.co/sybil</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   06 APPROACH
   ═══════════════════════════════════════════════════════════════════ */
export function ApproachStation() {
  const principles = [
    {
      n: "PRIN · 01",
      h: "Restraint",
      p: "Negative space over visual noise. Borders for hierarchy, not shadows. If something doesn't serve navigation, remove it.",
    },
    {
      n: "PRIN · 02",
      h: "Sharp geometry",
      p: "Zero border-radius. Diamonds replace circles. Precision and measurement aesthetic throughout.",
    },
    {
      n: "PRIN · 03",
      h: "Instrument feel",
      p: "State changes are mechanical feedback. 150 ms ceiling. No bounce, no spring — every transition reads as a measurement snapping.",
    },
    {
      n: "PRIN · 04",
      h: "Three tiers",
      p: "Dawn is environment. Gold is wayfinding. Green is provenance. They never swap jobs; the signal stays legible.",
    },
    {
      n: "PRIN · 05",
      h: "Two voices",
      p: "PT Mono is the machine — labels, data, coordinates. PP Neue Montreal is the human — paragraphs and reading. No other faces.",
    },
    {
      n: "PRIN · 06",
      h: "Tokens or nothing",
      p: "Never hardcode a value. Every color, size, and motion constant comes from the scale. Single source of truth.",
    },
  ];

  return (
    <section className="station" id="approach" data-station="approach">
      <div className="station__idx">
        Section 06 · Approach
        <span className="landmark">Landmark · method · first principles</span>
      </div>
      <h2 className="station__title">
        Research station,
        <br />
        <em>not carnival.</em>
      </h2>
      <p className="station__lede">
        Everything we make is an instrument. Layout is orientation. Color is signal strength. Motion
        is mechanical feedback. Restraint over spectacle, every time.
      </p>

      <div className="principles">
        {principles.map((pr) => (
          <div className="principle" key={pr.n}>
            <div className="principle__n">{pr.n}</div>
            <h4>{pr.h}</h4>
            <p>{pr.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   07 ABOUT
   ═══════════════════════════════════════════════════════════════════ */
export function AboutStation() {
  return (
    <section className="station" id="about" data-station="about">
      <div className="station__idx">
        Section 07 · About
        <span className="landmark">Landmark · continuum drift · story field</span>
      </div>

      <div className="about">
        <div className="about__dial">
          <svg viewBox="-100 -100 200 200" fill="none">
            <circle r="90" stroke="var(--dawn-30)" strokeWidth="0.5" />
            <circle r="72" stroke="var(--dawn-15)" strokeWidth="0.3" strokeDasharray="1 2" />
            <g stroke="var(--dawn-50)" strokeWidth="0.8">
              <path d="M0 -90 L0 -80" />
              <path d="M0 80 L0 90" />
              <path d="M-90 0 L-80 0" />
              <path d="M80 0 L90 0" />
            </g>
            <g stroke="var(--dawn-30)" strokeWidth="0.4">
              <path d="M0 -90 L0 -84" transform="rotate(30)" />
              <path d="M0 -90 L0 -84" transform="rotate(60)" />
              <path d="M0 -90 L0 -84" transform="rotate(120)" />
              <path d="M0 -90 L0 -84" transform="rotate(150)" />
              <path d="M0 -90 L0 -84" transform="rotate(210)" />
              <path d="M0 -90 L0 -84" transform="rotate(240)" />
              <path d="M0 -90 L0 -84" transform="rotate(300)" />
              <path d="M0 -90 L0 -84" transform="rotate(330)" />
            </g>
            <g
              style={{
                transformOrigin: "0 0",
                animation: "v2-rotate 40s linear infinite",
              }}
            >
              <path d="M0 -70 L6 10 L0 4 L-6 10 Z" fill="var(--gold)" opacity="0.85" />
            </g>
            <circle r="12" fill="var(--void)" stroke="var(--gold)" />
            <path d="M0 -6 L6 0 L0 6 L-6 0 Z" fill="var(--gold)" />
            <g
              fontFamily="var(--font-pt-mono)"
              fontSize="7"
              fill="var(--dawn-50)"
              textAnchor="middle"
            >
              <text x="0" y="-95">
                N
              </text>
              <text x="95" y="2" textAnchor="start">
                E
              </text>
              <text x="0" y="101">
                S
              </text>
              <text x="-95" y="2" textAnchor="end">
                W
              </text>
            </g>
          </svg>
        </div>

        <div>
          <p className="about__blurb">
            Thoughtform is a small studio building the instruments people need to{" "}
            <em>navigate intelligence.</em> We came from design, engineering, linguistics, and art;
            we stayed because this is the most important interface problem of our time.
          </p>
          <p className="about__blurb" style={{ fontSize: 16, color: "var(--dawn-70)" }}>
            We don&apos;t sell platforms. We ship instruments, teach navigation, and build workflows
            that hold up under real creative pressure.
          </p>

          <div className="about__stats">
            <div className="stat">
              <div className="stat__n">03</div>
              <div className="stat__l">Instruments shipped</div>
            </div>
            <div className="stat">
              <div className="stat__n">27+</div>
              <div className="stat__l">Teams guided</div>
            </div>
            <div className="stat">
              <div className="stat__n">09</div>
              <div className="stat__l">Countries</div>
            </div>
            <div className="stat">
              <div className="stat__n">v1.0</div>
              <div className="stat__l">Design system</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   08 CONTACT
   ═══════════════════════════════════════════════════════════════════ */
export function ContactStation() {
  return (
    <section className="station" id="contact" data-station="contact">
      <div className="contact">
        <div className="station__idx" style={{ justifyContent: "center" }}>
          Section 08 · Contact
          <span className="landmark" style={{ marginLeft: 0 }}>
            Event horizon · destination lock
          </span>
        </div>
        <h2 className="contact__title">
          Plot your
          <br />
          <em>course.</em>
        </h2>
        <p className="contact__desc">
          Ready to navigate intelligence with your team? Send a signal. We&apos;ll reply with a
          route.
        </p>
        <div className="contact__cta">
          <a href="mailto:hello@thoughtform.co" className="btn btn--solid">
            Initiate contact
            <span className="arrow" />
          </a>
        </div>
        <div className="contact__email">
          <a href="mailto:hello@thoughtform.co">hello@thoughtform.co</a>
        </div>
      </div>
    </section>
  );
}
