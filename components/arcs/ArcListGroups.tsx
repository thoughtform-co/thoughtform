import type { ArcSectionOf } from "@/lib/arcs/types";

import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText } from "./chrome";

interface ArcListGroupsProps {
  section: ArcSectionOf<"list-groups">;
  index: number;
}

/**
 * ArcListGroups — grouped lists. `stack` = status groups (LIVE / IN
 * PROGRESS / NOT YET — the first group's label reads gold); `columns` =
 * the substrate-map read (equal columns, closing line full-width
 * beneath).
 */
export function ArcListGroups({ section, index }: ArcListGroupsProps) {
  return (
    <section
      id={section.id}
      className="arc-section arc-sec"
      aria-label={section.ariaLabel ?? arcTitleText(section.head.title)}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="list-groups"
          index={index}
          sectionId={section.id}
        />
        <div className={`arc-groups arc-groups--${section.layout}`}>
          {section.groups.map((group, gi) => (
            <section
              key={group.id}
              className="arc-groups__group arc-reveal"
              aria-label={group.label}
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
          ))}
        </div>
        {section.closing ? <p className="arc-receipt arc-reveal">{section.closing}</p> : null}
      </div>
    </section>
  );
}
