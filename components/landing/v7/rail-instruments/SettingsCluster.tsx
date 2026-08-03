"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

import { DESTINATION_MARKS } from "./clusters";
import { RAIL_INSTRUMENTS } from "./flags";
import { MarkRow } from "./MarkRow";
import { useJourneyMarks } from "./useJourneyMarks";
import { ThemeToggleButton } from "../LightModeToggle";

/**
 * The BOTTOM-RIGHT corner — the DESTINATIONS and the settings, one row
 * (ADR-059 Update 2; Update 1 had settings here alone).
 *
 * The four corners each carry one idea: journey top-left, nav top-right,
 * brand bottom-left, settings bottom-right. This corner turned out to hold
 * two without conflict once they were made ONE FLEX ROW — marks outboard,
 * ending on the right rail's track line as the exact 180° mirror of the
 * approach row, and the controls inboard where a zone label would have sat.
 * §2's "the corner cannot hold both" was measured against a glyph row that
 * still carried LABELS (~36px against a ~26px strip); Update 1 dropped
 * those, and a bare 16px glyph row fits beside a control on the same line.
 *
 * ⚠ ITS OWN FIXED OVERLAY, OUTSIDE `.hud` — the ADR-058 constraint, and it
 * has not gone away just because the corner's contents changed. `.hud__rail`
 * and `.hud__corner--*` carry the ADR-031 U16 hero-curtain `clip-path`, so a
 * control hosted in either is invisible for the whole hero and then pops in
 * as the curtain lifts. Settings must be reachable on the first screen.
 * `.hud-nav-overlay` at z 60 is the precedent both follow.
 *
 * ⚠ WHICH IS WHY THE MARKS CARRY THAT CLIP THEMSELVES. They must reveal
 * WITH the frame — five glyphs sitting on the hero would break the ADR-031
 * U16 uncover — but the toggle beside them must not. So `.rin-settings__row`
 * re-declares the `--br` corner's own clip expression (its top offset is
 * identical: both boxes are `--hud-corner-zone` tall on the bottom margin
 * line) and the controls stay outside it. That expression is a COPY; if
 * `landing.css` retunes the curtain, retune it here too.
 *
 * ⚠ THE AUTH SUBSCRIPTION LIVES IN THE `SessionMark` LEAF, not here.
 * `useAuth` resolves asynchronously and re-renders whatever reads it; this
 * component is rendered by `LandingPage`, which owns a
 * `dangerouslySetInnerHTML` body with nested roots inside it. Reading auth
 * at this level would re-render the cluster on session resolve — harmless
 * here today, but it is one refactor away from being read as "LandingPage
 * may subscribe to auth", which is the regression `CelestialEditorGate`
 * documents. Keep the subscription at the leaf.
 *
 * The journey subscription is at a leaf for the same reason, and it is a
 * SECOND reader of the `<html>` bus rather than a value threaded down from
 * `RailInstruments` — those two are siblings under `LandingPage`, and the
 * only place to hold shared state between them would be `LandingPage`
 * itself. `useJourneyMarks` is a pure reader (one filtered
 * `MutationObserver` plus one gated passive listener), so a second instance
 * costs a subscription and no writer. ADR-002 bans new scroll WRITERS.
 */

/**
 * Visible ONLY to a signed-in allowlisted user (owner, 2026-08-02).
 *
 * A login affordance on a public marketing page tells every visitor there
 * is an admin surface and where it is, for the benefit of exactly one
 * person who already knows. So there is no "sign in" control: the door is
 * `/admin` by URL, and this mark appears once you are through it — as a way
 * back to the tools, and as the frame admitting it knows who you are.
 *
 * `process.env.NODE_ENV` is deliberately NOT an escape hatch here, unlike
 * `CelestialEditorGate`: that gate opens an editing overlay that is useful
 * in local dev, whereas this is a link that works for nobody who is not
 * allowlisted anyway.
 */
function SessionMark() {
  const { user } = useAuth();
  if (!isAllowedUserEmail(user?.email)) return null;

  return (
    <Link
      href="/admin"
      className="rin-session"
      aria-label="Admin tools — signed in"
      title={`Signed in as ${user?.email ?? "admin"}`}
    >
      {/* Brackets closing on a diamond. Deliberately the `encode` glyph's
          vocabulary — that mark is registration brackets around a lattice —
          so the settings corner reads as the same instrument family as the
          journey row rather than as a borrowed UI icon. */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />
        <path fill="currentColor" stroke="none" d="M12 8.4 15.6 12 12 15.6 8.4 12Z" />
      </svg>
    </Link>
  );
}

/**
 * The destination half of the row.
 *
 * Gated on `RAIL_INSTRUMENTS` rather than on `SETTINGS_CLUSTER`: these are
 * journey marks, and flipping the instruments off must take them with it
 * while leaving the theme switch — the site's only theme affordance —
 * exactly where it was. That is the whole reason the two flags are separate.
 */
function DestinationMarks() {
  const { activeIdx, seat } = useJourneyMarks(true);

  return (
    <span className="rin-settings__row" aria-hidden="true">
      <MarkRow marks={DESTINATION_MARKS} activeIdx={activeIdx} seat={seat} />
    </span>
  );
}

export function SettingsCluster() {
  return (
    <div className="rin-settings" data-rin-settings>
      {/* Controls INBOARD, marks OUTBOARD — so the last mark lands on the
          right rail's track line and the row mirrors the approach corner.
          DOM order is that reading order; nothing here is focusable except
          the controls, which come first in the tab order as a result. */}
      <span className="rin-settings__ctl">
        <SessionMark />
        <ThemeToggleButton />
      </span>
      {RAIL_INSTRUMENTS && <DestinationMarks />}
    </div>
  );
}
