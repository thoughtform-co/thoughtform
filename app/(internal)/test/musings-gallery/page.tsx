import { cardsFor } from "@/lib/musings/cards";
import { outlineOf } from "@/lib/musings/outline";
import { listedPosts } from "@/lib/musings/registry";
import { todayIn } from "@/lib/sheet/dates";
import { sliceV7Sections } from "@/lib/v7-parse";

import { LAB_MUSINGS } from "../musings-row/placeholders";

import type { GalleryPost } from "./directions/kit";
import { MusingsGalleryLabShell } from "./MusingsGalleryLabShell";
import { LAB_OUTLINES } from "./outlines";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING — `../musings-row/page.tsx`'s order,
   which is the marketing route's, and the lab's own sheets LAST:

     landing.css · home-v2.css · musings.css   the production station
     theme.css                                 last of the production set, or
                                               `?theme=light` is a fiction
     rail-instruments.css                      after theme, as the landing
     musings-row-lab.css                       the frame, the bed, the console
     musings-gallery-lab.css                   the directions */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/musings/musings.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "../musings-row/musings-row-lab.css";
import "./musings-gallery-lab.css";

/**
 * A SERVER component, and it stays static: `sliceV7Sections` reads the
 * prototype off disk and the registry reads `content/musings/`, both at build.
 * ⚠ The body never crosses into the client — the projection is the card's
 * record plus the OUTLINE read off the body here (`lib/musings/outline.ts`).
 * ⚠ `today` is asked ONCE, here, in the practice's own zone; nothing in the
 * directions reads a clock.
 */
export default function MusingsGalleryLabRoute() {
  const slice = sliceV7Sections([]);
  const posts = listedPosts();
  const live: GalleryPost[] = cardsFor(posts).map((c, i) => ({
    ...c,
    outline: outlineOf(posts[i].body),
    author: posts[i].author,
  }));
  /* The placeholders are the owner's own voice, so they carry his byline. */
  const lab: GalleryPost[] = LAB_MUSINGS.map((c) => ({
    ...c,
    outline: LAB_OUTLINES[c.slug] ?? { sections: [], words: 0 },
    author: "Vince Buyssens",
  }));
  return (
    <MusingsGalleryLabShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      live={live}
      lab={lab}
      today={todayIn("Europe/Brussels")}
    />
  );
}
