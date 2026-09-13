import type { ArcListGroup, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
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
 */
export function ArcListGroups({ section, index, motion = "reveal" }: ArcListGroupsProps) {
  const columns = section.layout === "columns";
  const plates = section.layout === "plates";
  return (
    <ArcBeat
      id={section.id}
      kind="list-groups"
      className="arc-section arc-sec"
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
        <div className={`arc-groups arc-groups--${section.layout}`}>
          {section.groups.map((group, gi) =>
            plates ? (
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
 * an INVERSE band at the floor. Square, on the house tokens: the deck's
 * 12px radii and soft card are its own material, not this surface's.
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
      {group.foot ? (
        <footer className="arc-plate__foot">
          <span className="arc-plate__foot-label">{group.foot.label}</span>
          {group.foot.lines.map((line) => (
            <span key={line} className="arc-plate__foot-line">
              {line}
            </span>
          ))}
        </footer>
      ) : null}
    </section>
  );
}
