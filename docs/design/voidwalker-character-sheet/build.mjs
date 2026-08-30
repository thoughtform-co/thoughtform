// Builds the nine Voidwalker character-sheet artboards.
// Authored at 1600x1256 - the owner's own window shape - with every ladder
// value computed to absolute px from the live CSS so the mockups match what
// the stage actually resolves to at that size.
import { readFileSync, writeFileSync } from "node:fs";

const B = (f) => readFileSync(f, "utf8");
const FONT_MONO = B("PTMono-Regular.b64");
const FONT_BOOK = B("PPNeueMontreal-Book.b64");
const FONT_MED = B("PPNeueMontreal-Medium.b64");

/* ── the resolved ladder at 1600x1256 ─────────────────────────────────── */
const W = 1600, H = 1256;
const PAD_S = 48, PAD_T = 28, PAD_B = 22;
// measured off the shipped screenshot: the HUD keeps a deep gutter on both
// sides (rail + tick numerals left, the bearing/sector readouts right), so
// the reading band is narrower than the stage padding suggests.
const COL = 354;                    // 38ch at 18px - the live max-width
const LX = 190, LW = COL;           // left column   190 -> 544
const CX = 556, CW = 488;           // media FRAME  556 -> 1044 (silhouette ~590->1030)
const RX = 1056, RW = COL;          // right column 1056 -> 1410
const RAIL_L = 52, RAIL_R = 1556, RAIL_T = 118, RAIL_B = 1163;
const COPY = 18, TITLE = 44, TITLE_SEAT = Math.round(TITLE * 3.3); // min-height:3.3em

/* ── the record, verbatim from lib/voidwalker/ ────────────────────────── */
const ERAS = [
  { y: "2026", n: "Architect", role: "The Intelligence Architect" },
  { y: "2022", n: "Latent Land", role: "The AI Captain" },
  { y: "2020", n: "Azeroth", role: "The Azeroth teacher" },
  { y: "2018", n: "The Expanse", role: "The campaign commander" },
  { y: "2016", n: "Pokémon GO", role: "The street organiser" },
];
const ACTIVE = 1;
const ERA = ERAS[ACTIVE];
const MOTTO = "The models arrived. Wrote the charter.";
const LOADOUT = "Blazer · shirt · Latent Land cape · cap.";
const FACTS = [
  ["Founded", "Starhaven"],
  ["First", "Hybrid AI-video production in Belgium"],
  ["Campaign", "Under Armour, with Anthony Joshua"],
  ["Charter", "UBA/ACC AI Charter, co-drafted"],
];
const PRESS = { outlet: "De Tijd", headline: "AI is the calculator for the creative mind" };
const FILM = "Welcome to Latent Land";
// beat.body with its {mark} and {em} structure kept (the live panel throws it away)
const SCOPE_BODY =
  `Founded <span class="mk">Starhaven</span>, one of Belgium's first AI consultancies ` +
  `for the creative industry. AI Captain on Welcome to Latent Land, ` +
  `<span class="em">the first hybrid AI-video production in Belgium</span>; ` +
  `AI direction on Under Armour's campaign with Anthony Joshua; co-drafted the UBA/ACC AI Charter.`;

/* ── shared stylesheet ────────────────────────────────────────────────── */
const CSS = `
@font-face{font-family:"PT Mono";src:url(data:font/woff2;base64,${FONT_MONO}) format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"PP Neue Montreal";src:url(data:font/woff2;base64,${FONT_BOOK}) format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"PP Neue Montreal";src:url(data:font/woff2;base64,${FONT_MED}) format("woff2");font-weight:500;font-display:block}
:root{
  --void:#0a0908; --void-deep:#050403;
  --dawn:235,227,214; --gold:202,165,84; --gold-lit:#f0c86a;
  --mono:"PT Mono",ui-monospace,monospace;
  --disp:"PP Neue Montreal",system-ui,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:#141210;font-family:var(--disp);-webkit-font-smoothing:antialiased}
a{color:#caa554}a:hover{color:var(--gold-lit)}

.stage{position:relative;width:${W}px;height:${H}px;background:var(--void);overflow:hidden;color:rgba(var(--dawn),.9)}
/* the corridor ambient the station is transparent onto */
.amb{position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(58% 42% at 50% 78%, rgba(var(--gold),.075), transparent 70%),
    radial-gradient(40% 30% at 50% 34%, rgba(var(--gold),.035), transparent 72%),
    radial-gradient(120% 90% at 50% 50%, transparent 42%, rgba(0,0,0,.55) 100%);}

/* ── HUD chrome ─────────────────────────────────────────────────────── */
.hud{position:absolute;inset:0;pointer-events:none}
.hud .glyphs{position:absolute;left:40px;top:44px;display:flex;gap:24px;align-items:center}
.hud .wm{position:absolute;right:${PAD_S}px;top:45px;font-family:var(--mono);font-size:11px;
  letter-spacing:.19em;color:rgba(var(--dawn),.92)}
.rail{position:absolute;top:${RAIL_T}px;height:${RAIL_B - RAIL_T}px;width:1px;background:rgba(var(--dawn),.13)}
.rail i{position:absolute;left:0;height:1px;background:rgba(var(--dawn),.16)}
.rail b{position:absolute;font-family:var(--mono);font-size:9px;font-weight:400;
  color:rgba(var(--dawn),.34);letter-spacing:.1em}
.ro{position:absolute;right:${W - RAIL_R + 11}px;width:126px;display:flex;align-items:center;gap:8px;
  font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:rgba(var(--dawn),.42)}
.ro s{flex:1;height:1px;background:rgba(var(--dawn),.16);text-decoration:none;min-width:22px}
.ro u{text-decoration:none;color:rgba(var(--gold),.85)}
.bm{position:absolute;left:${PAD_S}px;bottom:26px;font-family:var(--disp);font-weight:500;
  font-size:15px;line-height:1.12;letter-spacing:.05em;color:rgba(var(--dawn),.82)}
.bm em{font-style:normal;display:block;padding-left:26px;position:relative}
.bm em:before{content:"";position:absolute;left:4px;top:.52em;width:14px;height:1px;background:rgba(var(--gold),.8)}
.br{position:absolute;right:${PAD_S}px;bottom:30px;display:flex;gap:22px;align-items:center;opacity:.55}

/* ── the figure ─────────────────────────────────────────────────────── */
.fig{position:absolute;left:${CX}px;width:${CW}px}
.fig img{display:block;width:100%;height:auto;mix-blend-mode:screen}
.fig .glow{position:absolute;left:-24%;right:-24%;top:8%;bottom:-6%;pointer-events:none;
  background:radial-gradient(48% 42% at 50% 46%, rgba(var(--gold),.14), transparent 68%)}
.base{position:absolute;left:50%;translate:-50% 0;width:260px;height:58px}
.base .d{position:absolute;inset:12.8px 0;border:1px solid rgba(var(--gold),.55);border-radius:50%;
  background:radial-gradient(ellipse at 50% 50%, rgba(var(--gold),.24), rgba(var(--gold),.06) 60%, transparent 78%)}
.base .r{position:absolute;inset:0;border:1px solid rgba(var(--gold),.2);border-radius:50%}
.base .g{position:absolute;inset:-150% -14%;pointer-events:none;
  background:radial-gradient(ellipse at 50% 62%, rgba(var(--gold),.15), transparent 70%)}

/* ── type roles ─────────────────────────────────────────────────────── */
.kick{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  color:rgba(var(--gold),.85)}
.ttl{font-family:var(--disp);font-weight:400;font-size:${TITLE}px;line-height:1.1;
  letter-spacing:-.015em;color:rgba(var(--dawn),.98);margin:0}
.yr{font-family:var(--mono);font-size:15px;letter-spacing:.16em;color:#caa554}
.mot{font-family:var(--mono);font-size:12px;line-height:1.35;letter-spacing:.06em;color:rgba(var(--gold),.9)}
.body{font-family:var(--disp);font-size:${COPY}px;line-height:1.55;color:rgba(var(--dawn),.74);margin:0}
.body .mk{background:rgba(var(--gold),.17);color:rgba(var(--dawn),.98);padding:0 .18em}
.body .em{color:#caa554}
.pk{font-family:var(--disp);font-weight:500;font-size:17px;letter-spacing:.145em;
  text-transform:uppercase;color:rgba(var(--dawn),.98)}
.pt{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:rgba(var(--dawn),.6)}
.head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;
  padding-bottom:11px;border-bottom:1px solid rgba(var(--gold),.42)}
.blk{display:grid;gap:14px}
.facts{display:grid;gap:15px}
.fr{display:grid;gap:3px}
.fk{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(var(--gold),.84);white-space:nowrap}
.fv{font-family:var(--disp);font-size:${Math.round(COPY * 0.9)}px;line-height:1.4;color:rgba(var(--dawn),.9)}
.foot{display:grid;gap:5px}
.fok{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(var(--gold),.84)}
.fov{font-family:var(--mono);font-size:11px;line-height:1.5;color:rgba(var(--dawn),.64)}
.prs{display:grid;gap:6px}
.prh{font-family:var(--disp);font-size:${Math.round(COPY * 0.9)}px;line-height:1.45;color:rgba(var(--dawn),.9)}
.prm{font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(var(--dawn),.5)}
.film{display:grid;gap:10px;justify-items:start}
.film .fr2{position:relative;border:1px solid rgba(var(--gold),.3);width:280px}
.film .fr2 img{display:block;width:100%;height:auto}
.film .pl{position:absolute;left:50%;top:50%;translate:-50% -50%;width:34px;height:34px;
  border:1px solid rgba(var(--dawn),.75);border-radius:50%;display:grid;place-items:center}
.film .cap{font-family:var(--disp);font-size:${Math.round(COPY * 0.9)}px;color:rgba(var(--dawn),.88)}

/* ── zones ──────────────────────────────────────────────────────────── */
.z{position:absolute}
.zl{left:${LX}px;width:${LW}px}
.zr{left:${RX}px;width:${RW}px}

/* ── era switcher primitives ────────────────────────────────────────── */
.pip__y{font-family:var(--mono);font-size:9px;letter-spacing:.12em;color:rgba(var(--dawn),.5);line-height:1.2}
.pip__n{font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;
  color:rgba(var(--dawn),.45);line-height:1.25}
.dia{width:5px;height:5px;background:var(--gold);rotate:45deg}
`;

/* ── chrome ───────────────────────────────────────────────────────────── */
const G = (d) => `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(235,227,214,.5)" stroke-width="1">${d}</svg>`;
const GLYPHS = [
  G(`<path d="M7 1.5 8.6 5.4 12.5 7 8.6 8.6 7 12.5 5.4 8.6 1.5 7 5.4 5.4Z"/>`),
  G(`<path d="M1 8.5 3.6 8.5 5.2 4 7.6 10.5 9.4 7 13 7"/>`),
  G(`<path d="M2 3 5 7 2 11M6.5 3 9.5 7 6.5 11"/>`),
  G(`<path d="M2 4.5 7 2 12 4.5 7 7Z"/><path d="M2 8.5 7 11 12 8.5"/>`),
  G(`<path d="M2 2.5h3v3h-3zM9 2.5h3v3h-3zM2 8.5h3v3h-3zM9 8.5h3v3h-3z"/>`),
  G(`<circle cx="7" cy="4" r="2"/><path d="M2.5 12c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/>`),
  G(`<path d="M7 1.5v11M4.5 4.5 7 1.5l2.5 3M4.5 9.5 7 12.5l2.5-3"/>`),
];

function ticks() {
  let l = "", r = "";
  for (let y = 0; y <= RAIL_B - RAIL_T; y += 47.5) {
    const long = Math.round(y / 47.5) % 5 === 0;
    l += `<i style="top:${y.toFixed(1)}px;width:${long ? 14 : 7}px"></i>`;
    r += `<i style="top:${y.toFixed(1)}px;width:${long ? 14 : 7}px;left:${long ? -14 : -7}px"></i>`;
  }
  return [l, r];
}

function chrome({ readouts = true } = {}) {
  const [tl, tr] = ticks();
  const ro = readouts ? `
    <div class="ro" style="top:284px"><span>BEARING</span><s></s><u>084</u></div>
    <div class="ro" style="top:627px"><span>SECTOR</span><s></s><u>05/07</u></div>
    <div class="ro" style="top:1058px"><span>LOCAL</span><s></s><u>0.91</u></div>` : "";
  return `<div class="hud">
    <div class="glyphs">${GLYPHS.join("")}</div>
    <div class="wm">VOIDWALKER</div>
    <div class="rail" style="left:${RAIL_L}px">${tl}<b style="left:-16px;top:340px">2</b><b style="left:-16px;top:683px">5</b></div>
    <div class="rail" style="left:${RAIL_R}px">${tr}</div>
    ${ro}
    <div class="bm">THOUGHT<em>FORM</em></div>
    <div class="br">
      ${G(`<path d="M7 12V2M3.5 5.5 7 2l3.5 3.5"/>`)}
      ${G(`<circle cx="7" cy="7" r="2.6"/><path d="M7 .8v1.8M7 11.4v1.8M.8 7h1.8M11.4 7h1.8M2.6 2.6l1.3 1.3M10.1 10.1l1.3 1.3M11.4 2.6 10.1 3.9M3.9 10.1 2.6 11.4"/>`)}
    </div>
  </div>`;
}

/* ── the figure, seated so its boots land on the disc ─────────────────── */
function figure(baseBottom) {
  const baseTop = baseBottom - 58;
  const discTop = baseTop + 12.8;
  const mediaH = CW / 0.5625;            // 867.6 at frame width 488
  const mediaTop = discTop - 0.998 * mediaH;
  return `
  <div class="fig" style="top:${mediaTop.toFixed(1)}px;height:${mediaH.toFixed(1)}px">
    <div class="glow"></div>
    <img src="holo.jpg" alt="">
  </div>
  <div class="base" style="left:${CX + CW / 2}px;top:${baseTop.toFixed(1)}px">
    <div class="g"></div><div class="r"></div><div class="d"></div>
  </div>`;
}

/* ── block builders ───────────────────────────────────────────────────── */
const head = (k, tag = "") =>
  `<div class="head"><span class="pk">${k}</span>${tag ? `<span class="pt">${tag}</span>` : ""}</div>`;
const bareHead = (k, tag = "") =>
  `<div class="head" style="border-bottom:0;padding-bottom:0"><span class="pk">${k}</span>${tag ? `<span class="pt">${tag}</span>` : ""}</div>`;

const factsRows = () =>
  `<div class="facts">${FACTS.map(([k, v]) => `<div class="fr"><div class="fk">${k}</div><div class="fv">${v}</div></div>`).join("")}</div>`;
const scopeBody = () => `<p class="body">${SCOPE_BODY}</p>`;
const loadoutFoot = () => `<div class="foot"><div class="fok">Loadout</div><div class="fov">${LOADOUT}</div></div>`;
const pressBlock = () =>
  `<div class="prs"><div class="prh">${PRESS.headline}</div><div class="prm">${PRESS.outlet}</div></div>`;
const filmBlock = ({ wide = false } = {}) =>
  `<div class="film"><div class="fr2"${wide ? ` style="width:100%"` : ""}><img src="film.jpg" alt=""><div class="pl">
     <svg width="10" height="11" viewBox="0 0 10 11"><path d="M1 1l8 4.5L1 10Z" fill="rgba(235,227,214,.85)"/></svg>
   </div></div><div class="cap">${FILM}</div></div>`;

// The seat reserves three lines at 44px; a one-line role leaves ~95px of
// hole under it, which is the shipped "abandoned identity block". The motto
// lives INSIDE the seat, so the block is dense and SCOPE stops carrying it.
const mast = ({ tag = "", year = true } = {}) => `
  <div class="blk" style="gap:14px">
    <div class="head" style="border-bottom:0;padding-bottom:0">
      <span class="kick">Era 0${ACTIVE + 1} / 06</span>
      <span class="pt">${tag || (year ? ERA.y : "")}</span>
    </div>
    <div style="min-height:${TITLE_SEAT}px;display:grid;align-content:start;gap:18px">
      <h1 class="ttl">${ERA.role}</h1>
      <div class="mot">${MOTTO}</div>
    </div>
  </div>`;

/* chevron */
const chev = (dir, o = .55) => `<svg width="9" height="14" viewBox="0 0 9 14" fill="none"
  stroke="rgba(202,165,84,${o})" stroke-width="1.4"><path d="${dir === "l" ? "M7 1 2 7l5 6" : "M2 1l5 6-5 6"}"/></svg>`;

/* ── page wrapper ─────────────────────────────────────────────────────── */
function page(title, extraCss, bodyHtml) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>${title}</title>
  <style>${CSS}${extraCss}</style>
</helmet>
<div class="stage">
  <div class="amb"></div>
${bodyHtml}
</div>
</x-dc>
</body>
</html>
`;
}

/* ══ 00 · CURRENT ═══════════════════════════════════════════════════════ */
function current() {
  const stripW = 760, stripX = (W - stripW) / 2, pipW = (stripW - 5 * 12.8) / 6;
  const pips = ERAS.map((e, i) => `
    <button class="cpip" data-on="${i === ACTIVE}" style="width:${pipW.toFixed(1)}px">
      ${i === ACTIVE ? `<span class="dia" style="position:absolute;top:-3px;left:1px"></span>` : ""}
      <span class="pip__y">${e.y}</span><span class="pip__n">${e.n}</span>
    </button>`).join("");
  const css = `
    .strip{position:absolute;left:${stripX}px;top:119px;width:${stripW}px;display:flex;gap:12.8px}
    .cpip{position:relative;appearance:none;background:none;border:0;border-top:1px solid rgba(var(--dawn),.14);
      padding:7px 5px 4px;display:grid;gap:2px;text-align:left;min-height:44px}
    .cpip[data-on="true"]{border-top-color:var(--gold)}
    .cpip[data-on="true"] .pip__y{color:rgba(var(--gold),.9)}
    .cpip[data-on="true"] .pip__n{color:rgba(var(--dawn),.95)}
    .cap38{max-width:38ch}`;
  return page("Current — as shipped", css, `
  ${figure(1234)}
  <div class="strip">${pips}</div>
  <div class="z zl" style="top:205px"><div class="cap38">${mast()}</div></div>
  <div class="z zl" style="top:392px"><div class="blk cap38">${head("Facts", ERA.n)}${factsRows()}</div></div>
  <div class="z zl" style="top:998px"><div class="blk cap38">${head("On record")}${pressBlock()}</div></div>
  <div class="z zr" style="top:208px"><div class="blk cap38">${head("Scope")}
    ${scopeBody()}${loadoutFoot()}</div></div>
  <div class="z zr" style="top:966px"><div class="blk cap38">${head("Transmission")}${filmBlock()}</div></div>
  ${chrome()}`);
}

/* ══ 01 · FOOTER TRANSPORT — the shipped cut ═════════════════════════════ */
function footerTransport() {
  const ruleY = RAIL_B;                 // the axis meets both HUD rails' feet
  const AX_INSET = 208, AX_H = 52;
  const stops = ERAS.map((e, i) => {
    const on = i === ACTIVE;
    return `<button class="tst" data-on="${on}">
      <span class="tk"></span>
      <span class="ty">${e.y}</span>
      <span class="tn">${e.n}</span>
    </button>`;
  }).join("");
  const css = `
    /* the third rail: the two vertical ones carry space, this one carries time */
    .tl{position:absolute;left:${RAIL_L}px;right:${W - RAIL_R}px;top:${ruleY}px;height:${AX_H}px;
      border-top:1px solid rgba(var(--dawn),.22);padding-inline:${AX_INSET}px;
      display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}
    .tst{position:relative;appearance:none;background:none;border:0;padding:12px 6px 0;
      min-height:44px;display:grid;justify-items:center;align-content:start;gap:3px;
      cursor:pointer;text-align:center}
    .tst::before{content:"";position:absolute;top:0;left:50%;width:1px;height:6px;
      background:rgba(var(--dawn),.26);translate:-50% 0}
    .tst[data-on="true"]::before{top:-3px;width:6px;height:6px;background:var(--gold);
      translate:-50% 0;rotate:45deg}
    .ty{font-family:var(--mono);font-size:11px;line-height:1.3;letter-spacing:.15em;
      color:rgba(var(--dawn),.45);white-space:nowrap}
    .tst[data-on="true"] .ty{font-size:12.5px;color:var(--gold-lit)}
    /* the name keeps its box on every stop so the band never changes height */
    .tn{font-family:var(--mono);font-size:9px;line-height:1.25;letter-spacing:.19em;
      text-transform:uppercase;white-space:nowrap;color:rgba(var(--gold),.95);opacity:0}
    .tst[data-on="true"] .tn{opacity:1}
    .stack{display:grid;gap:40px;align-content:start}`;
  const baseBottom = ruleY + 12.8;     // the disc's bottom edge IS the rule
  return page("01 · Footer transport", css, `
  ${figure(baseBottom)}
  <div class="z zl" style="top:200px"><div class="stack">
    ${mast()}
    <div class="blk">${head("Scope")}${scopeBody()}</div>
  </div></div>
  <div class="z zr" style="top:200px"><div class="blk">${head("Facts", ERA.n)}${factsRows()}</div></div>
  <div class="z zl" style="top:820px"><div class="blk">${head("On record")}${pressBlock()}</div></div>
  <div class="z zr" style="top:820px"><div class="blk">${head("Transmission")}${filmBlock()}</div></div>
  <div class="tl">${stops}</div>
  ${chrome()}`);
}

/* ══ 02 · THE SHOULDERS ═════════════════════════════════════════════════ */
function shoulders() {
  const prev = ERAS[ACTIVE + 1], next = ERAS[ACTIVE - 1];
  const marks = ERAS.map((_, i) =>
    `<span class="tk" data-on="${i === ACTIVE}"></span>`).join("");
  const css = `
    .spine{position:absolute;width:1px;background:linear-gradient(180deg,
      rgba(var(--dawn),.05),rgba(var(--dawn),.2) 8%,rgba(var(--dawn),.2) 92%,rgba(var(--dawn),.05))}
    .stn{position:relative;padding-left:26px}
    .stn:before{content:"";position:absolute;left:0;top:9px;width:16px;height:1px;background:rgba(var(--gold),.75)}
    .stn .pk{display:block;margin-bottom:16px}
    .run{display:grid;gap:46px}
    .sh{position:absolute;bottom:44px;display:flex;align-items:center;gap:14px}
    .sh .sy{font-family:var(--mono);font-size:13px;letter-spacing:.16em;color:rgba(var(--dawn),.55)}
    .sh .sn{font-family:var(--mono);font-size:10px;letter-spacing:.19em;text-transform:uppercase;
      color:rgba(var(--dawn),.38)}
    .sh .lbl{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;
      color:rgba(var(--gold),.55);display:block;margin-bottom:5px}
    .ticks{position:absolute;left:50%;translate:-50% 0;bottom:52px;display:flex;gap:16px;align-items:center}
    .tk{width:26px;height:1px;background:rgba(var(--dawn),.26)}
    .tk[data-on="true"]{background:var(--gold);height:2px}`;
  return page("02 · The shoulders", css, `
  ${figure(1120)}
  <div class="spine" style="left:${LX}px;top:200px;height:920px"></div>
  <div class="spine" style="left:${RX}px;top:200px;height:920px"></div>
  <div class="z" style="left:${LX + 26}px;width:${LW - 26}px;top:200px">${mast({ tag: ERA.n })}</div>
  <div class="z" style="left:${LX}px;width:${LW}px;top:560px">
    <div class="run">
      <div class="stn"><span class="pk">Facts</span>${factsRows()}</div>
      <div class="stn"><span class="pk">On record</span>${pressBlock()}</div>
    </div>
  </div>
  <div class="z" style="left:${RX}px;width:${RW}px;top:200px">
    <div class="run">
      <div class="stn"><span class="pk">Scope</span>${scopeBody()}</div>
      <div class="stn"><span class="pk">Loadout</span><div class="fov" style="font-size:12px;letter-spacing:.05em">${LOADOUT}</div></div>
      <div class="stn"><span class="pk">Transmission</span>${filmBlock()}</div>
    </div>
  </div>
  <div class="sh" style="left:${LX}px">${chev("l")}<div>
    <span class="lbl">Previous</span><span class="sy">${prev.y}</span>
    <span class="sn" style="margin-left:10px">${prev.n}</span></div></div>
  <div class="sh" style="right:${W - (RX + RW)}px"><div style="text-align:right">
    <span class="lbl">Next</span><span class="sn" style="margin-right:10px">${next.n}</span>
    <span class="sy">${next.y}</span></div>${chev("r")}</div>
  <div class="ticks">${marks}</div>
  ${chrome()}`);
}

/* ══ 03 · THE INDEX COLUMN ══════════════════════════════════════════════ */
function indexColumn() {
  const rows = ERAS.map((e, i) => `
    <button class="ix" data-on="${i === ACTIVE}">
      <span class="ixb"></span>
      <span class="ixy">${e.y}</span>
      <span class="ixn">${e.n}</span>
      <span class="ixo">0${i + 1}</span>
    </button>`).join("");
  const css = `
    .idx{display:grid}
    .ix{position:relative;appearance:none;background:none;border:0;border-top:1px solid rgba(var(--dawn),.13);
      height:84px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:18px;
      padding:0 14px 0 22px;text-align:left;cursor:pointer}
    .ix:last-child{border-bottom:1px solid rgba(var(--dawn),.13)}
    .ixb{position:absolute;left:0;top:0;bottom:0;width:2px;background:transparent}
    .ixy{font-family:var(--mono);font-size:13px;letter-spacing:.14em;color:rgba(var(--dawn),.46);
      width:80px;white-space:nowrap}
    .ixn{font-family:var(--mono);font-size:12px;letter-spacing:.17em;text-transform:uppercase;color:rgba(var(--dawn),.5)}
    .ixo{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:rgba(var(--dawn),.22)}
    .ix[data-on="true"]{background:linear-gradient(90deg,rgba(var(--gold),.09),transparent 72%)}
    .ix[data-on="true"] .ixb{background:var(--gold)}
    .ix[data-on="true"] .ixy{color:var(--gold-lit)}
    .ix[data-on="true"] .ixn{color:rgba(var(--dawn),.97)}
    /* the register: hairline rows on one pitch */
    .reg{display:grid}
    .rrow{display:grid;grid-template-columns:112px 1fr;gap:16px;align-items:baseline;
      padding:11px 0;border-top:1px solid rgba(var(--dawn),.1)}
    .rrow .k{font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
      color:rgba(var(--gold),.8)}
    .rrow .v{font-family:var(--disp);font-size:15px;line-height:1.4;color:rgba(var(--dawn),.9)}
    .rsec{font-family:var(--disp);font-weight:500;font-size:12px;letter-spacing:.2em;text-transform:uppercase;
      color:rgba(var(--dawn),.42);padding-top:26px;padding-bottom:8px}`;
  const regRows = FACTS.map(([k, v]) => `<div class="rrow"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");
  return page("03 · The index column", css, `
  ${figure(1234)}
  <div class="z zl" style="top:200px">
    <div class="kick" style="margin-bottom:16px">Eras · 06</div>
    <div class="idx">${rows}</div>
  </div>
  <div class="z zl" style="top:820px"><div class="blk">${head("On record")}${pressBlock()}</div></div>
  <div class="z zr" style="top:200px">
    <div class="blk" style="gap:14px">
      <div class="kick">Era 0${ACTIVE + 1} / 06</div>
      <div style="min-height:${TITLE_SEAT}px;display:grid;align-content:start;gap:18px">
        <h1 class="ttl">${ERA.role}</h1>
        <div class="mot">${MOTTO}</div>
      </div>
      ${scopeBody()}
    </div>
    <div class="reg" style="margin-top:22px">
      <div class="rsec" style="padding-top:0">Facts</div>
      ${regRows}
      <div class="rsec">Loadout</div>
      <div class="rrow" style="grid-template-columns:1fr"><span class="v" style="font-family:var(--mono);font-size:12px;letter-spacing:.05em;color:rgba(var(--dawn),.66)">${LOADOUT}</span></div>
      <div class="rsec">Transmission</div>
      <div style="padding-top:12px;border-top:1px solid rgba(var(--dawn),.1)">${filmBlock()}</div>
    </div>
  </div>
  ${chrome()}`);
}

/* ══ 04 · THE DATED SPINE ═══════════════════════════════════════════════ */
function datedSpine() {
  const axY = 1172, x0 = PAD_S + 56, x1 = W - PAD_S - 56, span = x1 - x0;
  const at = (yr) => ((yr - 2014) / 12) * span; // axis-relative: .gt/.ax live inside .axis
  const anchors = [
    { yr: 2014, e: ERAS[5] }, { yr: 2017, e: ERAS[4] }, { yr: 2020, e: ERAS[3] },
    { yr: 2022, e: ERAS[2] }, { yr: 2025, e: ERAS[1] }, { yr: 2026, e: ERAS[0] },
  ];
  const grat = Array.from({ length: 13 }, (_, i) =>
    `<span class="gt" style="left:${at(2014 + i).toFixed(1)}px;height:${i % 2 ? 5 : 9}px"></span>`).join("");
  const stops = anchors.map((a) => {
    const on = a.e === ERA, x = at(a.yr);
    return `<button class="ax" data-on="${on}" style="left:${x.toFixed(1)}px">
      ${on ? `<span class="axn">${a.e.n}</span>` : ""}
      <span class="axs"></span><span class="axd"></span>
      <span class="axy">${a.e.y}</span></button>`;
  }).join("");
  const lad = (n) => Array.from({ length: n }, (_, i) =>
    `<span class="lt" style="top:${i * 24}px"></span>`).join("");
  const css = `
    .lad{position:absolute;width:1px;background:rgba(var(--dawn),.16)}
    .lt{position:absolute;left:0;width:6px;height:1px;background:rgba(var(--dawn),.24)}
    .lm{position:absolute;left:0;width:16px;height:1px;background:rgba(var(--gold),.85)}
    .lad--r .lt,.lad--r .lm{left:auto;right:0}
    .axis{position:absolute;left:${x0}px;width:${span}px;top:${axY}px;height:1px;background:rgba(var(--dawn),.34)}
    .gt{position:absolute;top:0;width:1px;background:rgba(var(--dawn),.26)}
    .ax{position:absolute;top:-46px;translate:-50% 0;appearance:none;background:none;border:0;padding:0;
      display:flex;flex-direction:column;align-items:center;cursor:pointer;width:96px}
    .axn{font-family:var(--mono);font-size:10px;letter-spacing:.19em;text-transform:uppercase;
      color:rgba(var(--gold),.95);margin-bottom:6px}
    .axs{width:1px;height:14px;background:rgba(var(--dawn),.22)}
    .ax[data-on="true"] .axs{background:rgba(var(--gold),.8);height:14px}
    .axd{width:5px;height:5px;rotate:45deg;background:rgba(var(--dawn),.3);margin-top:-3px}
    .ax[data-on="true"] .axd{background:var(--gold)}
    .axy{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:rgba(var(--dawn),.4);
      margin-top:15px;line-height:15px;height:15px}
    .ax[data-on="true"] .axy{color:var(--gold-lit);font-size:13px}
    .axcap{position:absolute;top:${axY + 46}px;font-family:var(--mono);font-size:10px;
      letter-spacing:.2em;text-transform:uppercase;color:rgba(var(--dawn),.28)}`;
  const zone = (side, top, inner) => {
    const isL = side === "l";
    return `<div class="z" style="left:${isL ? LX + 28 : RX}px;width:${COL - 28}px;top:${top}px">
      <span class="lm" style="position:absolute;left:${isL ? -28 : COL - 28 + 12}px;top:9px"></span>${inner}</div>`;
  };
  return page("04 · The dated spine", css, `
  ${figure(1130)}
  <div class="lad" style="left:${LX}px;top:200px;height:900px">${lad(38)}</div>
  <div class="lad lad--r" style="left:${RX + COL}px;top:200px;height:900px">${lad(38)}</div>
  ${zone("l", 200, mast())}
  ${zone("r", 200, `<div class="blk">${bareHead("Scope")}${scopeBody()}</div>`)}
  ${zone("l", 570, `<div class="blk">${bareHead("Facts")}${factsRows()}</div>`)}
  ${zone("r", 590, `<div class="blk">${bareHead("Loadout")}<div class="fov" style="font-size:12px;letter-spacing:.05em">${LOADOUT}</div></div>`)}
  ${zone("l", 880, `<div class="blk">${bareHead("On record")}${pressBlock()}</div>`)}
  ${zone("r", 780, `<div class="blk">${bareHead("Transmission")}${filmBlock()}</div>`)}
  <div class="axis">${grat}${stops}</div>
  <div class="axcap" style="left:${LX}px">Career axis</div>
  ${chrome()}`);
}

/* ══ 05 · THE CONSOLE ═══════════════════════════════════════════════════ */
function consoleDir() {
  const cx = RX, cy = 176, cw = COL, ch = 858;
  const tabs = ERAS.map((e, i) => `
    <button class="ctab" data-on="${i === ACTIVE}"><span>${e.y}</span></button>`).join("");
  const css = `
    .con{position:absolute;left:${cx}px;top:${cy}px;width:${cw}px;height:${ch}px;
      background:rgba(var(--gold),.16);
      clip-path:polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 26px 100%, 0 calc(100% - 26px))}
    .con__in{position:absolute;inset:1px;background:linear-gradient(180deg,rgba(10,9,8,.97),rgba(5,4,3,.99));
      clip-path:polygon(0 0, calc(100% - 25px) 0, 100% 25px, 100% 100%, 25px 100%, 0 calc(100% - 25px));
      display:flex;flex-direction:column}
    .con__glow{position:absolute;left:0;right:0;top:0;height:80px;pointer-events:none;
      background:linear-gradient(180deg,rgba(var(--gold),.1),transparent)}
    .con__tabs{display:flex;height:46px;border-bottom:1px solid rgba(var(--dawn),.11);flex:0 0 auto;
      padding-right:26px}
    .ctab{flex:1;appearance:none;background:none;border:0;padding:0 2px;cursor:pointer;position:relative;
      font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;
      color:rgba(var(--dawn),.42);display:grid;place-items:center;min-width:0}
    .ctab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .ctab[data-on="true"]{color:rgba(var(--dawn),.98)}
    .ctab[data-on="true"]:after{content:"";position:absolute;left:8px;right:8px;bottom:-1px;height:2px;background:var(--gold)}
    .con__body{flex:1;padding:26px 26px 30px;display:grid;gap:0;align-content:start;min-height:0}
    .csec{padding:22px 0;border-top:1px solid rgba(var(--dawn),.1);display:grid;gap:12px}
    .csec:first-child{border-top:0;padding-top:4px}
    .csec__h{display:flex;align-items:baseline;justify-content:space-between}
    .csec__k{font-family:var(--disp);font-weight:500;font-size:13px;letter-spacing:.2em;
      text-transform:uppercase;color:rgba(var(--dawn),.95)}
    .csec__t{font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:rgba(var(--dawn),.34)}`;
  return page("05 · The console", css, `
  ${figure(1234)}
  <div class="z zl" style="top:200px">${mast({ year: true, motto: true })}</div>
  <div class="z zl" style="top:520px"><div class="blk">${bareHead("Facts")}${factsRows()}</div></div>
  <div class="z zl" style="top:860px"><div class="blk">${bareHead("On record")}${pressBlock()}</div></div>
  <div class="con"><div class="con__in">
    <div class="con__glow"></div>
    <div class="con__tabs">${tabs}</div>
    <div class="con__body">
      <div class="csec"><div class="csec__h"><span class="csec__k">Scope</span><span class="csec__t">${ERA.n}</span></div>
        ${scopeBody()}</div>
      <div class="csec"><div class="csec__h"><span class="csec__k">Loadout</span><span class="csec__t">Worn</span></div>
        <div class="fov" style="font-size:12px;letter-spacing:.05em">${LOADOUT}</div></div>
      <div class="csec"><div class="csec__h"><span class="csec__k">Transmission</span><span class="csec__t">Film</span></div>
        ${filmBlock()}</div>
    </div>
  </div></div>
  ${chrome()}`);
}

/* ══ 06 · THE CARTRIDGE DECK ════════════════════════════════════════════ */
function cartridgeDeck() {
  // seven-unit pixel glyphs, one per era - rect-only, ADR-068 grammar
  const glyph = (cells) => `<svg width="26" height="26" viewBox="0 0 7 7">${
    cells.map(([x, y, t]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="${
      t === 1 ? "currentColor" : "rgba(235,227,214,.42)"}"/>`).join("")}</svg>`;
  const GL = [
    [[1,1,0],[3,1,1],[5,1,0],[1,3,1],[3,3,1],[5,3,1],[1,5,0],[3,5,1],[5,5,0]],           // architect: lattice
    [[3,0,1],[2,2,1],[3,2,1],[4,2,1],[1,4,1],[3,4,1],[5,4,1],[3,6,0]],                    // thoughtform: mark
    [[3,1,1],[2,2,0],[4,2,0],[1,3,1],[3,3,1],[5,3,1],[2,4,0],[4,4,0],[3,5,1]],            // latent land: diamond
    [[2,1,1],[3,1,1],[4,1,1],[1,2,0],[5,2,0],[1,3,0],[3,3,1],[5,3,0],[2,5,1],[4,5,1]],    // azeroth: portal
    [[1,2,0],[3,2,1],[5,2,0],[1,4,1],[3,4,0],[5,4,1],[2,6,0],[4,6,0]],                    // crowd: scatter
    [[1,1,1],[2,1,0],[1,2,0],[3,3,1],[4,4,0],[5,5,1],[1,5,0],[2,5,0]],                    // creatives: nib
  ];
  const plates = ERAS.map((e, i) => `
    <button class="crt" data-on="${i === ACTIVE}">
      <span class="crt__in">
        <span class="crt__g">${glyph(GL[i])}</span>
        <span class="crt__y">${e.y}</span>
      </span>
    </button>`).join("");
  const css = `
    .deck{position:absolute;left:50%;translate:-50% 0;top:1136px;display:flex;gap:16px;align-items:flex-end}
    .crt{appearance:none;background:none;border:0;padding:0;cursor:pointer;width:150px;height:70px;
      position:relative;color:rgba(var(--dawn),.55)}
    .crt__in{position:absolute;inset:0;background:rgba(var(--dawn),.14);
      clip-path:polygon(0 0, calc(100% - 13px) 0, 100% 13px, 100% 100%, 13px 100%, 0 calc(100% - 13px));
      display:block}
    .crt__in:before{content:"";position:absolute;inset:1px;background:#0d0b09;
      clip-path:polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))}
    .crt__g{position:absolute;left:17px;top:14px;z-index:1;line-height:0}
    .crt__y{position:absolute;right:16px;bottom:13px;z-index:1;font-family:var(--mono);font-size:13px;
      letter-spacing:.13em;color:rgba(var(--dawn),.5)}
    .crt[data-on="true"]{height:86px;color:var(--gold-lit)}
    .crt[data-on="true"] .crt__in{background:rgba(var(--gold),.85)}
    .crt[data-on="true"] .crt__in:before{background:#12100b}
    .crt[data-on="true"] .crt__y{color:var(--gold-lit);font-size:15px}
    /* brackets - framed, not a device */
    .bx{position:relative;padding:20px 24px}
    .bx:before,.bx:after{content:"";position:absolute;width:15px;height:15px;
      border:1px solid rgba(var(--gold),.5)}
    .bx:before{left:0;top:0;border-right:0;border-bottom:0}
    .bx:after{right:0;bottom:0;border-left:0;border-top:0}
    .bx i{position:absolute;width:15px;height:15px;border:1px solid rgba(var(--gold),.5)}
    .bx i.a{right:0;top:0;border-left:0;border-bottom:0}
    .bx i.b{left:0;bottom:0;border-right:0;border-top:0}`;
  const bx = (inner) => `<div class="bx"><i class="a"></i><i class="b"></i>${inner}</div>`;
  return page("06 · The cartridge deck", css, `
  ${figure(1110)}
  <div class="z zl" style="top:200px">${mast({ tag: ERA.n })}</div>
  <div class="z zl" style="top:540px">
    ${bx(`<div class="blk">${bareHead("Facts")}${factsRows()}</div>`)}</div>
  <div class="z zl" style="top:840px">
    ${bx(`<div class="blk">${bareHead("On record")}${pressBlock()}</div>`)}</div>
  <div class="z zr" style="top:200px">
    ${bx(`<div class="blk">${bareHead("Scope")}${scopeBody()}</div>`)}</div>
  <div class="z zr" style="top:560px">
    ${bx(`<div class="blk">${bareHead("Loadout")}<div class="fov" style="font-size:12px;letter-spacing:.05em">${LOADOUT}</div></div>`)}</div>
  <div class="z zr" style="top:750px">
    ${bx(`<div class="blk">${bareHead("Transmission")}${filmBlock()}</div>`)}</div>
  <div class="deck">${plates}</div>
  ${chrome()}`);
}

/* ══ 07 · THE RIGHT LADDER ══════════════════════════════════════════════ */
function rightLadder() {
  const RW2 = RW, RX2 = RX;
  const ly = 250, pitch = 128;
  const stops = ERAS.map((e, i) => {
    const on = i === ACTIVE;
    return `<button class="ls" data-on="${on}" style="top:${ly + i * pitch}px">
      ${on ? `<span class="lsn">${e.n}</span>` : ""}
      <span class="lsrow"><span class="lsr"></span><span class="lsy">${e.y}</span></span></button>`;
  }).join("");
  const css = `
    .lad2{position:absolute;left:1476px;top:${ly - 30}px;width:1px;
      height:${pitch * 5 + 60}px;background:rgba(var(--dawn),.14)}
    .ls{position:absolute;right:${PAD_S}px;appearance:none;background:none;border:0;padding:0;
      display:flex;flex-direction:column;align-items:flex-end;gap:5px;cursor:pointer;translate:0 -50%}
    .lsrow{display:flex;align-items:center;gap:10px}
    .lsn{font-family:var(--mono);font-size:9px;letter-spacing:.19em;text-transform:uppercase;
      color:rgba(var(--gold),.95);white-space:nowrap}
    .lsr{width:9px;height:1px;background:rgba(var(--dawn),.28)}
    .lsy{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:rgba(var(--dawn),.44);
      width:62px;text-align:left;white-space:nowrap}
    .ls[data-on="true"] .lsr{width:15px;background:var(--gold)}
    .ls[data-on="true"] .lsy{color:var(--gold-lit);font-size:13px}
    .ldc{position:absolute;right:${PAD_S}px;font-family:var(--mono);font-size:10px;
      letter-spacing:.2em;text-transform:uppercase;color:rgba(var(--dawn),.26)}
    /* the recess: a flat cut face, no border, no rule */
    .rec{position:absolute;background:rgba(3,2,1,.62)}
    .rk{font-family:var(--disp);font-weight:500;font-size:13px;letter-spacing:.2em;text-transform:uppercase;
      color:rgba(var(--gold),.9);display:block;margin-bottom:16px}`;
  return page("07 · The right ladder", css, `
  ${figure(1234)}
  <div class="rec" style="left:${LX - 34}px;top:496px;width:${LW + 68}px;height:572px"></div>
  <div class="rec" style="left:${RX2 - 34}px;top:186px;width:${RW2 + 68}px;height:882px"></div>
  <div class="z zl" style="top:200px">${mast({ tag: ERA.n })}</div>
  <div class="z zl" style="top:540px"><div class="blk"><span class="rk">Facts</span>${factsRows()}</div></div>
  <div class="z zl" style="top:900px"><div class="blk"><span class="rk">On record</span>${pressBlock()}</div></div>
  <div class="z" style="left:${RX2}px;width:${RW2}px;top:226px">
    <div class="blk"><span class="rk">Scope</span>${scopeBody()}</div></div>
  <div class="z" style="left:${RX2}px;width:${RW2}px;top:660px">
    <div class="blk"><span class="rk">Loadout</span><div class="fov" style="font-size:12px;letter-spacing:.05em">${LOADOUT}</div></div></div>
  <div class="z" style="left:${RX2}px;width:${RW2}px;top:790px">
    <div class="blk"><span class="rk">Transmission</span>${filmBlock()}</div></div>
  <div class="ldc" style="top:${ly - 52}px">Eras</div>
  <div class="lad2"></div>${stops}
  ${chrome({ readouts: false })}`);
}

/* ── emit ─────────────────────────────────────────────────────────────── */
const FILES = [
  ["Current.dc.html", current()],
  ["Main.dc.html", footerTransport()],
  ["Shoulders.dc.html", shoulders()],
  ["IndexColumn.dc.html", indexColumn()],
  ["DatedSpine.dc.html", datedSpine()],
  ["Console.dc.html", consoleDir()],
  ["CartridgeDeck.dc.html", cartridgeDeck()],
  ["RightLadder.dc.html", rightLadder()],
];
for (const [n, s] of FILES) { writeFileSync(n, s); console.log(n, (s.length / 1024).toFixed(0) + "kb"); }

const XS = [0, 1720, 3440, 5160], YS = [0, 1456];
const order = FILES.map(([n]) => n);
const artboards = order.map((f, i) => ({
  file: f, x: XS[i % 4], y: YS[Math.floor(i / 4)], w: W, h: H,
}));
const NOTES = [
  ["note-current", "AS SHIPPED — the baseline.\nFive blocks on five unrelated baselines: the left stack starts at grid-row 3 and the right at row 2, and both centre their contents in tracks of different heights, so their tops can never relate."],
  ["note-01", "01 · FOOTER TRANSPORT — leading candidate.\nSwitcher: full-width ladder on the floor; years only, the active one lit with its era name on a tick.\nPanels: three shared datums (200 / 560 / 860) and head rules at one measure.\nTrade-off: the bar and the plinth both want the floor — the figure stands 94px higher to give them one horizon."],
  ["note-02", "02 · THE SHOULDERS — your own proposal, literally.\nSwitcher: previous era bottom-left, next bottom-right, six ticks between them for position.\nPanels: one continuous spine per column, each section a tick stepping off it. No head rules at all.\nTrade-off: ±1 era per click — a scrub, not an index."],
  ["note-03", "03 · THE INDEX COLUMN — the Cyberpunk codex read.\nSwitcher: a six-row list owning the left column, gold left bearing on the active row.\nPanels: everything consolidates right as one ruled register; the title moves INTO it, so a list on the left and a title on the right can never be confused.\nTrade-off: three columns of unequal weight; the most application-like of the seven."],
  ["note-04", "04 · THE DATED SPINE — draw the record, not a tab strip.\nSwitcher: a real dated axis, 2014–2026, eras at their true dates so the GAPS are part of the reading.\nPanels: a graduation ladder on each outboard edge; heads carry a long gold tick instead of an underline.\nTrade-off: most house-consistent, least character-select."],
  ["note-05", "05 · THE CONSOLE — reopens the “no boxes” ruling, deliberately.\nONE machined housing on the right (TR+BL chamfer, gold hairline, square children) with the era tabs fused inside its top edge, so they read as that panel's control rather than page navigation. Left stays bare.\nTrade-off: you closed this in August. Included so the choice is explicit — if boxes are still out, this is the option that proves it."],
  ["note-06", "06 · THE CARTRIDGE DECK — eras as objects, not words.\nSwitcher: six chamfered plates on the floor, year + glyph, the active one raised and lit. No era name in the deck at all, so duplication is impossible by construction.\nPanels: ADR-065 brackets — framed, not a device, so the cartridges stay the only chamfered things on screen.\nTrade-off: six glyphs is real work, and this is the one most at risk of reading as game chrome."],
  ["note-07", "07 · THE RIGHT LADDER — maximum distance from the title.\nSwitcher: a vertical year ladder set into the right HUD rail, where the bearing/sector readouts live (they step aside for it).\nPanels: a flat recess wash — material without a container, no border, no rule.\nTrade-off: a wash IS a fill, so this is the closest of the six non-box options to what you rejected; and the recess must be re-measured in light, where the ground inverts."],
];
const annotations = NOTES.map(([id, text], i) => ({
  id, x: XS[i % 4] + 8, y: (YS[Math.floor(i / 4)] || 0) - 168, w: 620, text,
}));
writeFileSync("canvas.json", JSON.stringify({
  artboards, annotations, launch: { view: "canvas" },
}, null, 2));
console.log("canvas.json", artboards.length, "artboards,", annotations.length, "notes");
