"use client";

import type { CSSProperties, ReactNode, Ref } from "react";

import { ClientTabs } from "@/components/landing/home-v2/services/casefile/ClientTabs";
import { Directory } from "@/components/landing/home-v2/services/casefile/Directory";
import { TrackProofRegister } from "@/components/landing/home-v2/services/casefile/TrackProofRegister";
import { LOOP_EARPLUGS_CASE } from "@/lib/cases/content/loop-earplugs";
import type { CaseSegment } from "@/lib/cases/types";

/**
 * CasefileChrome — the SHIPPED proof casefile, with the variant dropped into its
 * right-hand visualization slot.
 *
 * The point of this lab is FIDELITY: a redesigned panel has to be judged as a
 * screenshot of the live surface, not as a component on a blank page. So nothing
 * here is restated — the tabs, the brief, the four proof blocks, the four
 * directory rows, the designation rail, the dashed rules, the dotted corner
 * reticles and the foot telemetry are the shipped components reading the shipped
 * content module, and `casefile.css` is imported unmodified.
 *
 * Extracted from the round-3 shell so v4 and v5 mount the SAME chrome. If the two
 * variants ever look different at the edges, that is a bug in the variant, not a
 * difference in its frame.
 */

const CASE = LOOP_EARPLUGS_CASE;
const FILE = CASE.casefile;
const TRACK = FILE.tracks.find((t) => t.id === "ai-transformation") ?? FILE.tracks[0];
const CASEFILE_TABS = [{ slug: CASE.slug, ix: FILE.ix, tab: FILE.tab }];
const PANEL_ID = "iml-casefile-panel";

export function CasefileChrome({
  vizRef,
  children,
}: {
  vizRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const rowId = `${CASE.slug}-row-${TRACK.id}`;

  return (
    <section className="fl-case" aria-label={`Case file — ${CASE.client}`}>
      <div data-fl-panel style={{ "--ci-off": 0.07, "--fl-dy": "-26px" } as CSSProperties}>
        <ClientTabs
          tabs={CASEFILE_TABS}
          activeSlug={CASE.slug}
          onSelect={() => {}}
          controls={PANEL_ID}
        />
      </div>

      {/* Connection grammar — dashed runs and the dotted reticle pair. */}
      <i className="fl-rule fl-rule--section" data-fl-panel aria-hidden="true" />
      <i className="fl-split" data-fl-panel aria-hidden="true" />
      <i className="fl-rule fl-rule--brief" data-fl-panel aria-hidden="true" />
      <i className="fl-rule fl-rule--viz" data-fl-panel aria-hidden="true" />
      <i
        className="fl-ret fl-ret--tr"
        data-fl-panel
        style={{ "--fl-dx": "30px" } as CSSProperties}
        aria-hidden="true"
      />
      <i
        className="fl-ret fl-ret--bl"
        data-fl-panel
        style={{ "--fl-dx": "-30px" } as CSSProperties}
        aria-hidden="true"
      />

      {/* ── Left column · the real brief ─────────────────────────────── */}
      <div
        className="fl-brief"
        data-fl-panel
        style={{ "--ci-off": 0.24, "--fl-dx": "-48px" } as CSSProperties}
      >
        <h3 className="fl-brief__title">
          <span>{TRACK.project}</span>
          <b className="fl-brief__dot">.</b>
        </h3>
        <p className="fl-brief__class">{TRACK.classification ?? FILE.classLine}</p>
        <p className="fl-brief__body">{(TRACK.brief ?? FILE.brief).map(renderSegment)}</p>
      </div>

      <TrackProofRegister track={TRACK} />

      <Directory
        tracks={FILE.tracks}
        activeId={TRACK.id}
        onSelect={() => {}}
        controls={PANEL_ID}
        idPrefix={CASE.slug}
      />

      {/* ── Right column · THE ARTIFACT ──────────────────────────────── */}
      <div className="fl-panel" id={PANEL_ID} role="tabpanel" aria-labelledby={rowId}>
        <div
          className="fl-panel__head"
          data-fl-panel
          style={{ "--ci-off": 0.4, "--fl-dx": "48px" } as CSSProperties}
        >
          <span className="fl-desig">{TRACK.preview}</span>
          <span className="fl-desig fl-desig--r">{TRACK.vizLabel}</span>
        </div>

        <div
          className="fl-panel__viz"
          data-fl-panel
          ref={vizRef}
          style={{ "--ci-off": 0.44, "--fl-dx": "48px" } as CSSProperties}
          data-kind="intelligence-map"
        >
          {children}
        </div>
      </div>

      {/* ── Foot telemetry ───────────────────────────────────────────── */}
      <div
        className="fl-foot"
        data-fl-panel
        style={{ "--ci-off": 0.56, "--fl-dy": "28px" } as CSSProperties}
      >
        <span className="fl-tele">
          <i className="fl-diamond" aria-hidden="true" />
          {TRACK.stamp
            ? `${TRACK.stamp.ord} · ${TRACK.stamp.phase} · ${TRACK.stamp.ref} · `
            : `00 · Field log · ${FILE.logCode} · `}
          <b>{FILE.state}</b>
        </span>
      </div>
    </section>
  );
}

function renderSegment(seg: CaseSegment, i: number) {
  if (typeof seg === "string") return <span key={i}>{seg}</span>;
  // `<em>` is restyled to UPRIGHT gold on a wash — the site never sets italics.
  return <em key={i}>{seg.em}</em>;
}
