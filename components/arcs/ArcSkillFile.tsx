import type { ArcMotion, ArcSectionOf, ArcSkillLine } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcSkillFileProps {
  section: ArcSectionOf<"skill-file">;
  index: number;
  motion?: ArcMotion;
}

/** The front matter's two rules run together on one line, so the key is set
 *  apart from the value it introduces without a second element in the
 *  record. Everything else letters its own text and nothing more. */
function FileLine({ line }: { line: ArcSkillLine }) {
  return (
    <span
      className="arc-sf__line"
      data-skill-as={line.as}
      data-skill-mark={line.mark ? String(line.mark) : undefined}
    >
      {line.mark ? (
        <b className="arc-sf__n" aria-hidden="true">
          {line.mark}
        </b>
      ) : null}
      {line.key ? <i className="arc-sf__key">{line.key}</i> : null}
      {line.text}
    </span>
  );
}

/**
 * ArcSkillFile — a skill, as the file it is (ADR-139).
 *
 * This is the load-bearing picture of the practical chapter. A room that
 * has never seen a Skill will hear "the team writes down how it works" and
 * picture a product, a form, a portal — anything but the truth, which is
 * that it is a text file in plain language with a name at the top. Saying
 * so does not land. Showing the file does.
 *
 * The file on the left with three lines marked, the three notes those marks
 * carry on the right — when Claude reaches for it, how the work is done,
 * and where it stops and asks — and the rest of the folder underneath.
 *
 * ⚠ THE FILE IS REAL, SHORTENED. What is drawn is an excerpt of a Skill
 * that exists, in its own words. An invented file would teach the room the
 * shape of a thing nobody wrote, and the one question that always comes
 * back ("so who writes this?") has no honest answer if the answer is
 * nobody.
 *
 * ⚠ THE THREE MARKS ARE THE ARGUMENT, not decoration: the description is
 * what makes Claude reach for the skill at all, the rules are the team's
 * own craft written once, and the stop is what keeps it from inventing.
 * Every Skill worth the name has those three, which is why the notes are a
 * fixed three and not a list.
 *
 * ⚠ `<i>` HERE IS NOT EMPHASIS. It carries the front-matter key, set in the
 * mono face by the stylesheet; the site's no-italics law is about display
 * copy, and the registry's no-markup rule walks the RECORD, never the
 * renderer's own element names.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-skill-*` only.
 */
export function ArcSkillFile({ section, index, motion = "reveal" }: ArcSkillFileProps) {
  const { badge, path, where, lines, notes, folder } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="skill-file"
      className="arc-section arc-sec arc-sec--skillfile"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        {badge ? <span className="arc-sf__badge">{badge}</span> : null}
        <ArcSectionHead
          head={section.head}
          kind="skill-file"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-sf arc-reveal" data-skill-figure="" {...rung(motion, 0.14)}>
          <figure className="arc-plate arc-sf__file" {...rung(motion, 0.18)}>
            <figcaption className="arc-sf__filemast">
              <span className="arc-sf__path">{path}</span>
              <span className="arc-sf__where">{where}</span>
            </figcaption>
            <div className="arc-sf__body">
              {lines.map((line) => (
                <FileLine key={line.id} line={line} />
              ))}
            </div>
          </figure>

          <div className="arc-sf__side">
            <ol className="arc-sf__notes">
              {notes.map((note, i) => (
                <li
                  key={note.id}
                  className="arc-sf__note"
                  data-skill-note={String(note.n)}
                  {...rung(motion, ladder(0.22, 0.05, i, 0.4))}
                >
                  <b className="arc-sf__n" aria-hidden="true">
                    {note.n}
                  </b>
                  <span className="arc-sf__notetitle">{note.title}</span>
                  <span className="arc-sf__notebody">{note.body}</span>
                </li>
              ))}
            </ol>

            <div className="arc-sf__folder" {...rung(motion, 0.4)}>
              <span className="arc-sf__folderlabel">{folder.label}</span>
              <ul className="arc-sf__folderitems">
                {folder.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
