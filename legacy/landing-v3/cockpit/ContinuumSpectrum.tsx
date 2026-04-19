"use client";

/**
 * Continuum Spectrum — shown in the bridge-frame during the manifesto phase.
 * Replaces v3's manifesto terminal with v5 Clean Bridge's section-3:
 *
 *   AI isn't software to command. It's intelligence to navigate.
 *   ───────────────────────────────────────────────────────────
 *   Tool                  AI lives here               Collaborator
 *   ◆━━━━━━━━━━━━━━━━━━━━━━━━━━━◆━━━━━━━━━━━━━━━━━━━━━━━━━━━━◆
 *   Executes commands     Neither pure tool /         Interprets intent
 *                         nor true collaborator
 *
 * Parent controls opacity + pointer-events via the surrounding phase wrapper.
 */
export function ContinuumSpectrum() {
  return (
    <div className="continuum">
      <div className="continuum__statement">
        <h2 className="continuum__headline">
          AI isn&apos;t software to command.
          <br />
          It&apos;s <em>intelligence to navigate.</em>
        </h2>
        <p className="continuum__sub">
          Software is commanded. Intelligence is navigated. AI sits on a continuum between tool and
          collaborator — and the ratio shifts with every prompt.
        </p>
      </div>

      <div className="continuum__spectrum" aria-hidden="false">
        <div className="continuum__rail">
          <span className="continuum__diamond continuum__diamond--l" />
          <span className="continuum__diamond continuum__diamond--c" />
          <span className="continuum__diamond continuum__diamond--r" />
        </div>

        <div className="continuum__cols">
          <div className="continuum__col">
            <div className="continuum__col-label">Tool</div>
            <div className="continuum__col-title">Executes commands</div>
            <div className="continuum__col-desc">
              You provide the thinking. The output is predictable, because you already know what you
              wanted.
            </div>
          </div>

          <div className="continuum__col continuum__col--center">
            <div className="continuum__col-label">AI lives here</div>
            <div className="continuum__col-title">
              Neither pure tool
              <br />
              nor true collaborator
            </div>
            <div className="continuum__col-desc">
              Always both. Every prompt relocates the dot along the rail. Learning where to stand is
              the skill.
            </div>
          </div>

          <div className="continuum__col continuum__col--right">
            <div className="continuum__col-label">Collaborator</div>
            <div className="continuum__col-title">Interprets intent</div>
            <div className="continuum__col-desc">
              You provide direction and judgment. The output surprises you — in useful ways, if
              you&apos;ve learned to navigate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
