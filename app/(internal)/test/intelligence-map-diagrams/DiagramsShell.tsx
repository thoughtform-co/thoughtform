"use client";

/**
 * Client shell for the diagram lab: parsed HUD chrome + the real casefile
 * chrome (imported from the intelligence-map-lab, which extracted it exactly
 * so sibling rounds mount the SAME chrome) + a minimal dev strip.
 */

import { CasefileChrome } from "../intelligence-map-lab/CasefileChrome";
import { Instrument } from "./Instrument";

interface Props {
  hudHtml: string;
  bodyClass: string;
}

function setTheme(theme: "dark" | "light") {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem("tf-theme", theme);
  } catch {
    /* storage may be unavailable; the attribute alone is enough for the lab */
  }
}

export function DiagramsShell({ hudHtml, bodyClass }: Props) {
  return (
    <main className={`imd-lab home-v2-root ${bodyClass}`} data-theme="dark">
      <div
        className="imd-lab__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      <div className="imd-lab__strip">
        <span className="imd-lab__strip-name">INTELLIGENCE MAP / THREE-LEVEL DIAGRAMS</span>
        <span className="imd-lab__strip-note">PLAN · SECTION · BRAID — ONE LINE GRAMMAR</span>
        <span className="imd-lab__strip-spacer" />
        <button type="button" onClick={() => setTheme("dark")}>
          DARK
        </button>
        <button type="button" onClick={() => setTheme("light")}>
          LIGHT
        </button>
      </div>
      <div className="imd-lab__stage">
        <CasefileChrome>
          <Instrument />
        </CasefileChrome>
      </div>
    </main>
  );
}
