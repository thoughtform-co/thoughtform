import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcRepositoryProps {
  section: ArcSectionOf<"repository">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcRepository — the configuration made real, as containment (ADR-146).
 *
 * The client's Claude organisation is the outer frame, lettered with the
 * settings it holds for everyone. Inside it sits the marketplace it syncs
 * from GitHub, a dashed frame like the plugin board's (a wrapper round things
 * that already exist), and inside that the plugins, one cartridge each, with
 * the skills they carry as rows. The files the repository keeps beside the
 * plugins run along the marketplace's foot; the interfaces sit on a bar
 * under the organisation.
 *
 * ⚠ THE NESTING IS THE BEAT. Six answers on a frame round four plates is
 * the board again (owner, 2026-10-04); six answers at four depths is where a
 * person would actually go to find each one.
 *
 * ⚠ GOLD IS WHAT THE TEAM WRITES, the board's law at a third scale: only a
 * row answering the context or the evaluations is lit, and the guard pins
 * it. A GHOST row is a skill named for a later week, dashed and never lit.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER, NO SVG. `data-repo-*` only.
 */
export function ArcRepository({ section, index, motion = "reveal" }: ArcRepositoryProps) {
  const { org, repo, plugins, bar, alt } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="repository"
      className="arc-section arc-sec arc-sec--repo"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="repository"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div
          className="arc-repo arc-reveal"
          role="group"
          aria-label={alt}
          data-repo-figure=""
          {...rung(motion, 0.14)}
        >
          <div className="arc-repo__org" data-repo-org="">
            <header className="arc-repo__mast">
              <span className="arc-repo__label">{org.label}</span>
              <span className="arc-repo__name">{org.name}</span>
            </header>

            <ul className="arc-repo__settings" data-repo-n={org.settings.length}>
              {org.settings.map((s, i) => (
                <li
                  key={s.id}
                  className="arc-plate arc-repo__setting"
                  data-repo-setting={s.id}
                  {...rung(motion, ladder(0.18, 0.04, i, 0.3))}
                >
                  <span className="arc-repo__settingname">{s.name}</span>
                  <span className="arc-repo__line">{s.line}</span>
                  {s.answers ? <span className="arc-repo__answers">{s.answers}</span> : null}
                </li>
              ))}
            </ul>

            <div className="arc-repo__market" data-repo-market="">
              <header className="arc-repo__mast arc-repo__mast--market">
                <span className="arc-repo__label">{repo.label}</span>
                <span className="arc-repo__name arc-repo__name--mono">{repo.name}</span>
                <span className="arc-repo__mastline">{repo.line}</span>
              </header>

              <div className="arc-repo__plugins" data-repo-n={plugins.length}>
                {plugins.map((p, i) => (
                  <section
                    key={p.id}
                    className="arc-plate arc-repo__plugin"
                    data-repo-plugin={p.id}
                    aria-label={p.shown}
                    {...rung(motion, ladder(0.24, 0.05, i, 0.4))}
                  >
                    <header className="arc-repo__pluginhead">
                      <span className="arc-repo__pluginid">{p.name}</span>
                      <span className="arc-repo__pluginshown">{p.shown}</span>
                      <span className="arc-repo__who">{p.who}</span>
                    </header>
                    <ul className="arc-repo__items">
                      {p.items.map((item) => (
                        <li
                          key={item.id}
                          className="arc-repo__item"
                          data-repo-item={item.id}
                          data-repo-tone={item.lit ? "lit" : item.ghost ? "ghost" : "quiet"}
                        >
                          <span className="arc-repo__itemname">{item.name}</span>
                          <span className="arc-repo__itemline">{item.line}</span>
                          {item.answers ? (
                            <span className="arc-repo__answers">{item.answers}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <ul className="arc-repo__files" {...rung(motion, 0.36)}>
                {repo.files.map((f) => (
                  <li key={f.id} className="arc-repo__file" data-repo-file={f.id}>
                    <span className="arc-repo__path">{f.path}</span>
                    <span className="arc-repo__line">{f.line}</span>
                    {f.answers ? <span className="arc-repo__answers">{f.answers}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <footer className="arc-repo__bar" {...rung(motion, 0.4)}>
            <span className="arc-repo__barline">{bar.line}</span>
            <span className="arc-repo__answers">{bar.answers}</span>
          </footer>
        </div>
      </div>
    </ArcBeat>
  );
}
