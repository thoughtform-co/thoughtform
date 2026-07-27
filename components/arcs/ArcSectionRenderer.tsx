import type { ArcSection } from "@/lib/arcs/types";

import { ArcAnatomy } from "./ArcAnatomy";
import { ArcCards } from "./ArcCards";
import { ArcClose } from "./ArcClose";
import { ArcInterstitial } from "./ArcInterstitial";
import { ArcListGroups } from "./ArcListGroups";
import { ArcMediaSection } from "./ArcMediaSection";
import { ArcPortrait } from "./ArcPortrait";
import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText } from "./chrome";

/**
 * ArcSectionRenderer — exhaustive dispatch over the section union
 * (compile-time `never` check keeps new kinds honest).
 */
export function ArcSectionRenderer({ sections }: { sections: readonly ArcSection[] }) {
  return (
    <>
      {sections.map((section, index) => {
        switch (section.kind) {
          case "head":
            return (
              <section
                key={section.id}
                id={section.id}
                className="arc-section arc-sec arc-sec--chapter"
                aria-label={section.ariaLabel ?? arcTitleText(section.head.title)}
              >
                <div className="arc-band">
                  <ArcSectionHead
                    head={section.head}
                    kind="head"
                    index={index}
                    sectionId={section.id}
                    align="center"
                  />
                </div>
              </section>
            );
          case "cards":
            return <ArcCards key={section.id} section={section} index={index} />;
          case "list-groups":
            return <ArcListGroups key={section.id} section={section} index={index} />;
          case "anatomy":
            return <ArcAnatomy key={section.id} section={section} index={index} />;
          case "interstitial":
            return <ArcInterstitial key={section.id} section={section} />;
          case "media":
            return <ArcMediaSection key={section.id} section={section} index={index} />;
          case "portrait":
            return <ArcPortrait key={section.id} section={section} index={index} />;
          case "close":
            return <ArcClose key={section.id} section={section} />;
          default: {
            const exhaustive: never = section;
            return exhaustive;
          }
        }
      })}
    </>
  );
}
