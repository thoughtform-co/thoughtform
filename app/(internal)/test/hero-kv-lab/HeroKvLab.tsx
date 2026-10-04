"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { HudNav } from "@/components/landing/v7/HudNav";
import { RailManifestController } from "@/components/landing/v7/RailManifest";

import { HERO_KVS, framing, plateSrc } from "./kvs";

/**
 * The lab shell. Three render-stable pieces and one switcher:
 *
 *   - the HUD frame (parse-injected markup + the production nav and rail
 *     controller), mounted exactly as `LandingPage` mounts it;
 *   - the HERO, the production `<section class="hero">` as innerHTML; the
 *     plate is swapped by MUTATING its `<img>`, never by re-rendering the
 *     markup (a re-keyed innerHTML would reset the swap and the nav's hooks);
 *   - the filmstrip, the one thing React re-renders.
 *
 * ⚠ The `<source>` (AVIF) element is removed on first swap: a `<picture>`
 * prefers its source over the `<img>`'s `src`, so leaving it would keep the
 * shipped plate on screen whatever the strip says.
 */
const HudFrame = memo(function HudFrame({ hudHtml }: { hudHtml: string }) {
  const hudRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div
        ref={hudRef}
        className="home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      <RailManifestController containerRef={hudRef} />
      <HudNav />
    </>
  );
});

const HeroHost = memo(function HeroHost({
  heroHtml,
  hostRef,
}: {
  heroHtml: string;
  hostRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <main className="stations">
      <div
        ref={hostRef}
        style={{ display: "contents" }}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: heroHtml }}
      />
    </main>
  );
});

export function HeroKvLab({
  hudHtml,
  heroHtml,
  bodyClass,
}: {
  hudHtml: string;
  heroHtml: string;
  bodyClass: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(1);
  // `?kv=<id>` opens the lab on an entry (captures address a candidate by URL). Read after
  // mount: the server renders entry 1, so a URL read during render would mismatch hydration.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("kv");
    const n = id ? HERO_KVS.findIndex((k) => k.id === id) : -1;
    if (n >= 0) setI(n);
    // `?chrome=off` opens with the dock hidden (a capture of a phone option wants the plate alone).
    if (new URLSearchParams(window.location.search).get("chrome") === "off") setChrome(false);
  }, []);
  const [chrome, setChrome] = useState(true);
  const [copy, setCopy] = useState(true);
  const [missing, setMissing] = useState(false);
  const kv = HERO_KVS[i];

  // The plates are dark; the lab pins the dark theme so a stored light
  // preference cannot hide the <picture> behind theme.css's light plate. A
  // LIGHT entry (ADR-145) flips it, so production's own light rules paint.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute("data-theme");
    html.setAttribute("data-theme", kv.theme ?? "dark");
    return () => {
      if (prev) html.setAttribute("data-theme", prev);
    };
  }, [kv.theme]);

  // A light CANDIDATE (wave 06 round 4): painted inline over production's light rule,
  // the portrait on the <=640 rung, floor-anchored exactly as the shipped one is.
  useEffect(() => {
    const bg = heroRef.current?.querySelector<HTMLElement>(".hero__bg");
    if (!bg || !kv.light) return;
    const phone = window.matchMedia("(max-width: 640px)").matches;
    bg.style.backgroundImage = `url("${phone ? kv.light.phone : kv.light.hero}")`;
    bg.style.backgroundPosition = phone ? "60% 100%" : "center";
    bg.style.backgroundSize = "cover";
    return () => {
      bg.style.backgroundImage = "";
      bg.style.backgroundPosition = "";
      bg.style.backgroundSize = "";
    };
  }, [kv]);

  useEffect(() => {
    const root = rootRef.current;
    const bg = heroRef.current?.querySelector<HTMLElement>(".hero__bg");
    const img = bg?.querySelector("img");
    if (!root || !bg || !img) return;
    bg.querySelectorAll("source").forEach((s) => s.remove());
    img.loading = "eager";
    img.removeAttribute("srcset");
    img.onload = () => setMissing(false);
    img.onerror = () => setMissing(true);
    // The <=640 rung paints the portrait (ADR-145): the shipped one, or a phone option's.
    const phone = window.matchMedia("(max-width: 640px)").matches;
    img.src = phone && kv.portrait ? kv.portrait : plateSrc(kv);
    const { fx, zoom } = framing(kv);
    root.style.setProperty("--kv-zoom", String(zoom));
    root.style.setProperty("--kv-origin-y", `${(kv.fy * 100).toFixed(1)}%`);
    // A portrait plate takes production's own seat on the phone (landing.css: `60% 100%`,
    // the head on the floor); the subject-centred position is for a landscape plate's window.
    root.style.setProperty(
      "--kv-pos-phone",
      kv.portrait ? "60% 100%" : `${(fx * 100).toFixed(1)}% 50%`
    );
  }, [kv]);

  const step = useCallback(
    (d: number) => setI((v) => (v + d + HERO_KVS.length) % HERO_KVS.length),
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key.toLowerCase() === "h") setChrome((v) => !v);
      else if (e.key.toLowerCase() === "t") setCopy((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const { zoom } = framing(kv);

  return (
    <div
      ref={rootRef}
      className={`hkv ${bodyClass}`}
      data-theme="dark"
      data-copy={copy ? "on" : "off"}
    >
      <HudFrame hudHtml={hudHtml} />
      <HeroHost heroHtml={heroHtml} hostRef={heroRef} />

      {missing && (
        <div className="hkv__missing" role="alert">
          No plate at {plateSrc(kv)}. Run <code>node scripts/hero-kv-lab/prepare.mjs</code> with the
          Drive mounted.
        </div>
      )}

      <div className="hkv__dock" data-open={chrome ? "on" : "off"}>
        <div className="hkv__readout">
          <span className="hkv__label">{kv.label}</span>
          <span className="hkv__meta">
            {kv.job === "light"
              ? kv.light
                ? "light candidate"
                : "light theme"
              : kv.job === "live"
                ? kv.tag === "phone option"
                  ? "phone option over the shipped landscape plate"
                  : "shipped plate"
                : kv.job === "gateway"
                  ? "retired plate"
                  : `job ${kv.job}`}
            {kv.mirror ? " · mirrored" : ""}
            {zoom > 1.001 ? ` · zoom ${zoom.toFixed(2)}` : ""}
          </span>
          {kv.tag && <span className="hkv__tag">{kv.tag}</span>}
          {kv.note && <span className="hkv__meta">{kv.note}</span>}
          <span className="hkv__keys">← → switch · T text · H hide</span>
        </div>
        <div className="hkv__strip" role="tablist" aria-label="Key visuals">
          {HERO_KVS.map((k, n) => (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={n === i}
              className="hkv__thumb"
              onClick={() => setI(n)}
              title={`${k.label}${k.tag ? " · " + k.tag : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local lab thumbs from the gitignored previews folder */}
              <img
                src={plateSrc(k, k.job !== "live" && k.job !== "gateway")}
                alt={k.label}
                loading="lazy"
              />
              <span>{k.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
