import type { ArcListGroup, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcExploded } from "./ArcExploded";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcListGroupsProps {
  section: ArcSectionOf<"list-groups">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcListGroups — grouped lists. `stack` = status groups (LIVE / IN
 * PROGRESS / NOT YET — the first group's label reads gold); `columns` =
 * the substrate-map read (equal columns, closing line full-width
 * beneath); `plates` (ADR-098 U2) = the deck's plan table, each group a
 * bordered plate with a head band, ruled rows and an inverse outcome foot.
 *
 * Terminal rungs: stacked groups all enter from the left (the casefile
 * directory read); column groups alternate sides so the map converges on
 * its own centre — which is also the slit the iris closes on; plates rise
 * from below in sequence, the cards' own rung.
 *
 * `readout` (ADR-130) = two plates whose rows are framed readout rows, the
 * workshop's "what we covered · what we do today". It takes its own beat
 * class so its air can be tightened without a format selector (the workshop
 * format is shared by three pages).
 */
export function ArcListGroups({ section, index, motion = "reveal" }: ArcListGroupsProps) {
  const columns = section.layout === "columns";
  const plates = section.layout === "plates";
  const readout = section.layout === "readout";
  return (
    <ArcBeat
      id={section.id}
      kind="list-groups"
      className={readout ? "arc-section arc-sec arc-sec--readout" : "arc-section arc-sec"}
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="list-groups"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div
          className={`arc-groups arc-groups--${section.layout}`}
          data-readout-exploded={readout && section.exploded ? "" : undefined}
        >
          {section.groups.map((group, gi) =>
            readout ? (
              <ArcReadout
                key={group.id}
                group={group}
                lead={gi === section.groups.length - 1}
                motion={motion}
                gi={gi}
                side={gi === 0 ? "record" : "index"}
              />
            ) : plates ? (
              <ArcPlate key={group.id} group={group} lead={gi === 0} motion={motion} gi={gi} />
            ) : (
              <section
                key={group.id}
                className="arc-groups__group arc-reveal"
                aria-label={group.label}
                {...rung(motion, ladder(0.16, 0.08, gi, 0.5), columns && gi % 2 === 1 ? 44 : -44)}
              >
                <header className="arc-groups__head">
                  <span className="arc-groups__label" data-lead={gi === 0 || undefined}>
                    {group.label}
                  </span>
                  {group.blurb ? <span className="arc-groups__blurb">{group.blurb}</span> : null}
                </header>
                <ul className="arc-groups__items">
                  {group.items.map((item) => (
                    <li key={item.id} className="arc-groups__item">
                      {item.tag ? <span className="arc-groups__tag">{item.tag}</span> : null}
                      <span className="arc-groups__name">
                        {item.href ? (
                          <a href={item.href} target="_blank" rel="noreferrer">
                            {item.name}
                          </a>
                        ) : (
                          item.name
                        )}
                      </span>
                      {item.body ? <span className="arc-groups__body">{item.body}</span> : null}
                      {item.meta ? <span className="arc-groups__meta">{item.meta}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            )
          )}
          {readout && section.exploded ? (
            <ArcExploded label={section.exploded.label} layers={section.exploded.layers} />
          ) : null}
        </div>
        {section.closing ? (
          <p className="arc-receipt arc-reveal" {...rung(motion, 0.52, 0, 22)}>
            {section.closing}
          </p>
        ) : null}
      </div>
    </ArcBeat>
  );
}

/**
 * One plate (ADR-098 U2). The deck's `.plan .col`: a head band carrying
 * the mono kicker (`label`) over the name (`blurb`), one ruled row per
 * item — the mono `tag` heading the item's two lines — and the outcome as
 * an INVERSE band at the floor. On the house tokens: the deck's 12px radii
 * and soft card are its own material, not this surface's.
 *
 * ⚠ THE PLATE IS A CHAMFERED HOUSING SINCE U3 (owner, 2026-09-14: the cards
 * "should have the notch") — TR + BL at the plate rung, drawn entirely in
 * `arcs.css`; the head, the rows and the foot stay square (ADR-065 rule 4)
 * and this markup does not change for it.
 */
function ArcPlate({
  group,
  lead,
  motion,
  gi,
}: {
  group: ArcListGroup;
  lead: boolean;
  motion: ArcMotion;
  gi: number;
}) {
  return (
    <section
      className="arc-groups__group arc-plate arc-reveal"
      aria-label={group.label}
      {...rung(motion, ladder(0.16, 0.08, gi, 0.5), 0, 36)}
    >
      <header className="arc-plate__head">
        <span className="arc-plate__kicker" data-lead={lead || undefined}>
          {group.label}
        </span>
        {group.blurb ? <span className="arc-plate__name">{group.blurb}</span> : null}
      </header>
      <ul className="arc-plate__rows">
        {group.items.map((item) => (
          <li key={item.id} className="arc-plate__row">
            {item.tag ? <span className="arc-plate__tag">{item.tag}</span> : null}
            <span className="arc-plate__line">
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.name}
                </a>
              ) : (
                item.name
              )}
            </span>
            {item.body ? <span className="arc-plate__line">{item.body}</span> : null}
            {item.meta ? <span className="arc-plate__meta">{item.meta}</span> : null}
          </li>
        ))}
      </ul>
      {group.foot ? <PlateFoot foot={group.foot} /> : null}
    </section>
  );
}

/** A plate's foot: the mono label over its lines, on the plate's gold wash. */
function PlateFoot({ foot }: { foot: NonNullable<ArcListGroup["foot"]> }) {
  return (
    <footer className="arc-plate__foot">
      <span className="arc-plate__foot-label">{foot.label}</span>
      {foot.lines.map((line) => (
        <span key={line} className="arc-plate__foot-line">
          {line}
        </span>
      ))}
    </footer>
  );
}

/**
 * One readout plate (ADR-130): the plate's own head band, then one framed
 * readout row per item — the key cell filled and outlined, the value outlined
 * on the shared edge and set right (Starfield's TRAVEL DATA, the /arcs
 * dossier's own row, owner 2026-09-21) — and the foot seated at the floor.
 *
 * ⚠ AN ITEM WITH AN `href` IS A LINK TO A BEAT ON THIS PAGE, and the whole
 * row is the target: the plate is then the day's index, the tool-index
 * grammar (ADR-079) at plate scale. In-page, so never `target="_blank"` —
 * the plate branch's external-link idiom would open the agenda in a new tab.
 *
 * ⚠ NO PROSE INSIDE THE PANEL. The head's sub carries the sentence; a panel
 * that repeats it as a paragraph is the slide the owner ruled out.
 */
function ArcReadout({
  group,
  lead,
  motion,
  gi,
  side,
}: {
  group: ArcListGroup;
  lead: boolean;
  motion: ArcMotion;
  gi: number;
  side: "record" | "index";
}) {
  return (
    <section
      className="arc-groups__group arc-plate arc-readout arc-reveal"
      aria-label={group.label}
      data-readout-group={group.id}
      data-readout-side={side}
      {...rung(motion, ladder(0.16, 0.08, gi, 0.5), 0, 36)}
    >
      <header className="arc-plate__head">
        <span className="arc-plate__kicker" data-lead={lead || undefined}>
          {group.label}
        </span>
        {group.blurb ? <span className="arc-plate__name">{group.blurb}</span> : null}
      </header>
      <ul className="arc-readout__rows">
        {group.items.map((item) => {
          const cells = (
            <>
              <span className="arc-readout__key">{item.tag}</span>
              <span className="arc-readout__val">{item.name}</span>
            </>
          );
          return (
            <li key={item.id} className="arc-readout__row" data-readout-row={item.id}>
              {item.href ? (
                <a className="arc-readout__hit" href={item.href}>
                  {cells}
                </a>
              ) : (
                <div className="arc-readout__hit">{cells}</div>
              )}
            </li>
          );
        })}
      </ul>
      {group.foot ? <PlateFoot foot={group.foot} /> : null}
    </section>
  );
}
