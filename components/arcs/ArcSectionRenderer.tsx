import type { ArcMotion, ArcSection } from "@/lib/arcs/types";

import { ArcAnatomy } from "./ArcAnatomy";
import { ArcBeat } from "./ArcBeat";
import { ArcCards } from "./ArcCards";
import { ArcClose } from "./ArcClose";
import { ArcDossier } from "./ArcDossier";
import { ArcInterstitial } from "./ArcInterstitial";
import { ArcListGroups } from "./ArcListGroups";
import { ArcMediaSection } from "./ArcMediaSection";
import { ArcPortrait } from "./ArcPortrait";
import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText } from "./chrome";

/**
 * ArcSectionRenderer — exhaustive dispatch over the section union
 * (compile-time `never` check keeps new kinds honest). `motion` is
 * threaded to every kind; it decides whether the section renders the
 * ADR-052 markup or the ADR-057 beat, and defaults to reveal so a new
 * call site cannot silently opt a page into the terminal grammar.
 */
export function ArcSectionRenderer({
  sections,
  motion = "reveal",
}: {
  sections: readonly ArcSection[];
  motion?: ArcMotion;
}) {
  return (
    <>
      {sections.map((section, index) => {
        switch (section.kind) {
          case "head":
            return (
              <ArcBeat
                key={section.id}
                id={section.id}
                kind="head"
                className="arc-section arc-sec arc-sec--chapter"
                ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
                motion={motion}
              >
                <div className="arc-band">
                  <ArcSectionHead
                    head={section.head}
                    kind="head"
                    index={index}
                    sectionId={section.id}
                    align="center"
                    motion={motion}
                  />
                </div>
              </ArcBeat>
            );
          case "cards":
            return <ArcCards key={section.id} section={section} index={index} motion={motion} />;
          case "list-groups":
            return (
              <ArcListGroups key={section.id} section={section} index={index} motion={motion} />
            );
          case "anatomy":
            return <ArcAnatomy key={section.id} section={section} index={index} motion={motion} />;
          case "interstitial":
            return <ArcInterstitial key={section.id} section={section} motion={motion} />;
          case "media":
            return (
              <ArcMediaSection key={section.id} section={section} index={index} motion={motion} />
            );
          case "portrait":
            return <ArcPortrait key={section.id} section={section} index={index} motion={motion} />;
          case "close":
            return <ArcClose key={section.id} section={section} motion={motion} />;
          case "dossier":
            return <ArcDossier key={section.id} section={section} index={index} motion={motion} />;
          default: {
            const exhaustive: never = section;
            return exhaustive;
          }
        }
      })}
    </>
  );
}
