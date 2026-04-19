"use client";

import type { CSSProperties } from "react";
import {
  type AnchorScreenState,
  useParticleAnchorById,
} from "@/components/hud/r3f/hooks/useParticleAnchor";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

function anchorStyle(
  anchor: AnchorScreenState,
  offsetX = 0,
  offsetY = 0,
  maxScale = 1.06
): CSSProperties {
  return {
    position: "fixed",
    left: `${anchor.screenX}px`,
    top: `${anchor.screenY}px`,
    opacity: anchor.visible ? 1 : 0,
    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${Math.min(
      maxScale,
      Math.max(0.88, anchor.scale * 0.94)
    )})`,
    pointerEvents: "none",
    zIndex: 14,
    transition: "opacity 100ms linear",
  };
}

function ContinuumHeadlineBand() {
  const anchor = useParticleAnchorById("continuumHeadline");

  return (
    <div className="crn-headline" style={anchorStyle(anchor, 0, -120, 1.04)}>
      <h2 className="crn-headline__text">
        AI isn&apos;t software to command.
        <br />
        It&apos;s <em>intelligence to navigate.</em>
      </h2>
    </div>
  );
}

interface NodeCalloutProps {
  anchorId: "continuumToolNode" | "continuumMiddleNode" | "continuumCollaboratorNode";
  label: string;
  title: string;
  desc: string;
  align: "left" | "center" | "right";
}

function ContinuumNodeCallout({ anchorId, label, title, desc, align }: NodeCalloutProps) {
  const anchor = useParticleAnchorById(anchorId);
  const offsetX = align === "left" ? -120 : align === "right" ? 120 : 0;
  const offsetY = align === "center" ? 56 : 52;

  return (
    <div
      className={`crn-node crn-node--${align}`}
      style={anchorStyle(anchor, offsetX, offsetY, 1.04)}
    >
      <span className="crn-node__tether" aria-hidden="true" />
      <span className="crn-node__label">{label}</span>
      <span className="crn-node__title">{title}</span>
      <span className="crn-node__desc">{desc}</span>
    </div>
  );
}

function ContinuumPromptMarker() {
  const anchor = useParticleAnchorById("continuumPromptMarker");

  return (
    <div className="crn-prompt" style={anchorStyle(anchor, 0, -18, 1.1)}>
      <span className="crn-prompt__pip" aria-hidden="true" />
    </div>
  );
}

function ContinuumReadout() {
  const anchor = useParticleAnchorById("continuumReadoutStrip");

  return (
    <div className="crn-readout" style={anchorStyle(anchor, 0, 180, 1.02)}>
      <span className="crn-readout__text">The ratio shifts with every prompt.</span>
    </div>
  );
}

function ContinuumDesktop() {
  return (
    <>
      <ContinuumHeadlineBand />

      <ContinuumNodeCallout
        anchorId="continuumToolNode"
        label="Tool"
        title="Executes commands"
        desc="You provide the thinking. The output is predictable."
        align="left"
      />
      <ContinuumNodeCallout
        anchorId="continuumMiddleNode"
        label="AI lives here"
        title="Neither pure tool nor true collaborator"
        desc="Always both. Every prompt relocates the dot along the rail."
        align="center"
      />
      <ContinuumNodeCallout
        anchorId="continuumCollaboratorNode"
        label="Collaborator"
        title="Interprets intent"
        desc="You provide direction and judgment. The output surprises you."
        align="right"
      />

      <ContinuumPromptMarker />
      <ContinuumReadout />
    </>
  );
}

function ContinuumMobile() {
  return (
    <div className="continuum continuum--mobile">
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

      <div className="continuum__spectrum">
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

export function ContinuumSpectrum() {
  const isMobile = useIsMobile();

  if (isMobile) return <ContinuumMobile />;
  return <ContinuumDesktop />;
}
