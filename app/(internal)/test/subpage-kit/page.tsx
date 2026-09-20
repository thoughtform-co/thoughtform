import { SheetRenderer } from "@/components/sheet/SheetRenderer";
import { SheetShell } from "@/components/sheet/SheetShell";
import { chaptersOf } from "@/lib/sheet/composition";
import { sliceV7Sections } from "@/lib/v7-parse";

import { KitConsole } from "./KitConsole";
import { kitSections } from "./fixtures";

import "@/components/landing/v7/landing.css";
import "@/components/sheet/sheet.css";
// Theme sheet LAST (ADR-058), then the corner instruments, then the lab's own chrome.
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "./subpage-kit.css";

/** The specimen sheet — a SERVER route, because the HUD slice reads the
 *  prototype off disk. */
export default function SubpageKitRoute() {
  const slice = sliceV7Sections([]);
  const sections = kitSections(new Date());
  return (
    <SheetShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      page="subpage-kit"
      chapters={chaptersOf(sections)}
    >
      <KitConsole />
      <SheetRenderer
        sections={sections}
        slots={{
          "prose-fixture": (
            <>
              <p className="sh-prose__p">
                The prose arrangement is a post&rsquo;s body: a sticky metadata column on the left
                three columns, the compiled text at the copy measure on the right, every figure
                framed. The measure is sixty-eight characters, which is where a line of this face
                stops asking the eye to travel.
              </p>
              <h2 className="sh-prose__h2">A heading inside the body</h2>
              <p className="sh-prose__p">
                Headings take the display face at the lit weight in sentence case. Emphasis is{" "}
                <em className="sh-prose__em">upright gold</em>, never italic. A quotation sits on a
                dawn hairline, never a coloured bar:
              </p>
              <blockquote className="sh-prose__blockquote">
                <p className="sh-prose__p">
                  A drawing earns its place by plotting something that happened; if all it knows is
                  an argument, the argument is better as a sentence.
                </p>
              </blockquote>
            </>
          ),
        }}
      />
    </SheetShell>
  );
}
