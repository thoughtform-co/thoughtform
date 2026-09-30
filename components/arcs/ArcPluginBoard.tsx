import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcPluginBoardProps {
  section: ArcSectionOf<"plugin-board">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcPluginBoard — the configuration, made real (ADR-139). The beat that
 * answers the question the six-question board leaves open: fine, but where
 * does each of those answers actually go to live?
 *
 * The marketplace and the account above; the PLUGIN drawn as a frame around
 * four plates — the skill, its evals, the connectors and the owner; the
 * skill that reads the others as a chip at the frame's centre; the
 * interfaces on a bar beneath it.
 *
 * ⚠ EVERY PLATE CARRIES ITS `answers` LINE, and that tie is the whole beat.
 * Without it this is a diagram of a folder, which is a thing no room has
 * ever needed to see. With it, the six answers the board wired are shown
 * landing somewhere a person can open.
 *
 * ⚠ GOLD IS WHAT THE TEAM WRITES — the board's law (ADR-130), held here so
 * the two beats read as one argument at two scales. The first two plates
 * are lit and the guard pins that they are the first two: a lit plate in
 * third place would say the team writes its own connectors.
 *
 * ⚠ THE FRAME IS THE OBJECT. The plugin is not a fifth plate beside the
 * four; it is what having all four in one place IS, so it is drawn as the
 * thing that contains them and letters only its own name.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-plugin-*` only.
 */
export function ArcPluginBoard({ section, index, motion = "reveal" }: ArcPluginBoardProps) {
  const { above, plugin, parts, centre, bar, alt } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="plugin-board"
      className="arc-section arc-sec arc-sec--plugin"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="plugin-board"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div
          className="arc-pb arc-reveal"
          role="group"
          aria-label={alt}
          data-plugin-figure=""
          {...rung(motion, 0.14)}
        >
          <div className="arc-pb__above">
            {above.map((node, i) => (
              <div
                key={node.id}
                className="arc-plate arc-pb__node"
                data-plugin-node={node.id}
                {...rung(motion, ladder(0.18, 0.04, i, 0.3))}
              >
                <span className="arc-pb__nodename">{node.name}</span>
                <span className="arc-pb__nodeline">{node.line}</span>
                {node.answers ? <span className="arc-pb__answers">{node.answers}</span> : null}
              </div>
            ))}
          </div>

          <div className="arc-pb__frame" data-plugin-frame="">
            <header className="arc-pb__framemast">
              <span className="arc-pb__framelabel">{plugin.label}</span>
              <span className="arc-pb__framename">{plugin.name}</span>
            </header>

            <div className="arc-pb__parts">
              {parts.map((part, i) => (
                <div
                  key={part.id}
                  className="arc-plate arc-pb__part"
                  data-plugin-part={part.id}
                  data-plugin-tone={part.lit ? "lit" : "quiet"}
                  {...rung(motion, ladder(0.24, 0.04, i, 0.4))}
                >
                  <span className="arc-pb__partname">{part.name}</span>
                  <span className="arc-pb__partline">{part.line}</span>
                  <span className="arc-pb__answers">{part.answers}</span>
                </div>
              ))}

              {/* The chip at the centre: the one skill every plugin carries,
                  which reads the work the others produce. It sits INSIDE the
                  frame because it ships with it, and it letters no `answers`
                  line — it is not one of the six. */}
              <div className="arc-pb__centre" data-plugin-centre="" {...rung(motion, 0.34)}>
                <span className="arc-pb__centrekicker">{centre.kicker}</span>
                <span className="arc-pb__centrename">{centre.name}</span>
                <span className="arc-pb__centreline">{centre.line}</span>
              </div>
            </div>

            <footer className="arc-pb__bar" {...rung(motion, 0.38)}>
              <span className="arc-pb__barline">{bar.line}</span>
              <span className="arc-pb__answers">{bar.answers}</span>
            </footer>
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
