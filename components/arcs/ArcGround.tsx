import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcGroundProps {
  section: ArcSectionOf<"ground">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcGround — why the work is built here (ADR-139). The beat that follows
 * the curve and answers what the curve implies: a general model got good
 * enough at enough things that a shelf of single-purpose platforms stopped
 * earning its keep.
 *
 * Two halves, side by side on one floor.
 *
 *   THE SHELF — dim, and drawn as what it is: separate plates that do not
 *     touch. Each has its own sign-in, its own bill and its own idea of the
 *     brand, and nothing carries between them. The absence of a wire IS the
 *     argument, so there is no connective drawing on this side at all.
 *   THE GROUND — lit, and read from the floor UP. The plinth is the
 *     intelligence, the one course nobody in the room can write. On it, the
 *     reach you connect. On that, the two things you write — the same two
 *     the configuration board lights, so the beat hands straight over.
 *
 * ⚠ NO VENDOR IS NAMED AND NO DIGIT IS LETTERED. The claim is about a shape
 * of purchase, not about four companies; a named competitor dates the page
 * the week it ships, and a price dates it faster. The shelf's plates say
 * what a thing DOES, never who sells it.
 *
 * ⚠ THE COURSES STACK IN THE DOM AS THEY STACK ON THE PAGE — steer, reach,
 * base — so the plinth is last in the source and lowest on the screen, and
 * a reader with no stylesheet still meets them in the order the argument
 * needs. The one rung that must not flip.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-ground-*` only.
 */
export function ArcGround({ section, index, motion = "reveal" }: ArcGroundProps) {
  const { shelf, floor, note, alt } = section;
  /* Steer over reach over base: the page's order and the source's, which is
     the whole reason this is an array and not three named renders. */
  const courses = [
    { id: "steer", tag: floor.steer.tag, line: floor.steer.line, items: floor.steer.items },
    { id: "reach", tag: floor.reach.tag, line: floor.reach.line, items: floor.reach.items },
  ] as const;
  return (
    <ArcBeat
      id={section.id}
      kind="ground"
      className="arc-section arc-sec arc-sec--ground"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="ground"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div
          className="arc-ground arc-reveal"
          role="group"
          aria-label={alt}
          data-ground-figure=""
          {...rung(motion, 0.14)}
        >
          <div className="arc-ground__stage">
            <section className="arc-ground__half" data-ground-half="shelf">
              <header className="arc-ground__mast">
                <span className="arc-ground__label">{shelf.label}</span>
                <span className="arc-ground__line">{shelf.line}</span>
              </header>
              <ul className="arc-ground__tools">
                {shelf.items.map((tool, i) => (
                  <li
                    key={tool.id}
                    className="arc-plate arc-ground__tool"
                    data-ground-tool={tool.id}
                    {...rung(motion, ladder(0.2, 0.04, i, 0.4))}
                  >
                    <span className="arc-ground__toolname">{tool.name}</span>
                    <span className="arc-ground__toolcost">{tool.cost}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="arc-ground__half" data-ground-half="floor">
              <header className="arc-ground__mast">
                <span className="arc-ground__label">{floor.label}</span>
              </header>
              <div className="arc-ground__stack">
                {courses.map((course, i) => (
                  <div
                    key={course.id}
                    className="arc-plate arc-ground__course"
                    data-ground-course={course.id}
                    {...rung(motion, ladder(0.2, 0.04, i, 0.4))}
                  >
                    <span className="arc-ground__tag">{course.tag}</span>
                    <span className="arc-ground__courseline">{course.line}</span>
                    <ul className="arc-ground__items">
                      {course.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {/* The plinth. Last in the source, lowest on the page, and the
                    one course the room cannot write. */}
                <div
                  className="arc-plate arc-ground__course"
                  data-ground-course="base"
                  {...rung(motion, 0.3)}
                >
                  <span className="arc-ground__tag">{floor.base.tag}</span>
                  <span className="arc-ground__basename">{floor.base.name}</span>
                  <span className="arc-ground__courseline">{floor.base.line}</span>
                </div>
              </div>
            </section>
          </div>
          <p className="arc-ground__note">{note}</p>
        </div>
      </div>
    </ArcBeat>
  );
}
