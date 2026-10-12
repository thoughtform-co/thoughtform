/* The section head, in the homepage services masthead's grammar (owner,
   2026-10-12: "the services section ("AI capability your team owns") with
   the little cross mark: that's what I also want … it needs to be uniform").

   COPIED, never imported (the house rule for grammars): the services
   masthead lives in `services.css` under the stage's reveal controller. Here
   it is static: the title left in the corridor's station-header voice
   (uppercase, second line gold), the brief right, each block a surveyed panel
   with a mono designation above, a faint coordinate stamp below and a masked
   dot-grid lift behind; the gold ORIGIN cross claims the title's head, the
   dawn CLOSE cross the brief's foot, one diagonal across the band. */

export interface MastheadCopy {
  lines: readonly [string, string];
  brief: string;
  survey: { title: string; brief: string; state: string; titleCoord: string; briefCoord: string };
}

/** The masthead's title alone, centred: no brief, no survey chrome (owner,
    2026-10-12, on the plug flow: "I just want to have an H1, so no
    paragraph, and the H1 should be centered"). Same type, second line gold. */
export function MastheadTitle({ lines }: { lines: readonly [string, string] }) {
  return (
    <header className="xm xm--title">
      <h2 className="xm__title" aria-label={lines.join(" ")}>
        <span aria-hidden>{lines[0]}</span>
        <span className="xm__em" aria-hidden>
          {lines[1]}
        </span>
      </h2>
    </header>
  );
}

export function Masthead({ copy }: { copy: MastheadCopy }) {
  return (
    <header className="xm">
      <div className="xm__lead">
        <i className="xm__grid" aria-hidden />
        <i className="xm__mark xm__mark--origin" aria-hidden />
        <span className="xm__desig" aria-hidden>
          {copy.survey.title}
        </span>
        <h2 className="xm__title" aria-label={copy.lines.join(" ")}>
          <span aria-hidden>{copy.lines[0]}</span>
          <span className="xm__em" aria-hidden>
            {copy.lines[1]}
          </span>
        </h2>
        <span className="xm__coord" aria-hidden>
          {copy.survey.titleCoord}
        </span>
      </div>
      <div className="xm__brief">
        <i className="xm__grid" aria-hidden />
        <span className="xm__desig" aria-hidden>
          {copy.survey.brief}
        </span>
        <span className="xm__state" aria-hidden>
          {copy.survey.state}
        </span>
        <p className="xm__copy">{copy.brief}</p>
        <span className="xm__coord xm__coord--r" aria-hidden>
          {copy.survey.briefCoord}
        </span>
        <i className="xm__mark xm__mark--close" aria-hidden />
      </div>
    </header>
  );
}
