"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

import { EXIT_MARKS } from "./clusters";
import { RAIL_INSTRUMENTS } from "./flags";
import { MarkRow } from "./MarkRow";
import { useJourneyMarks } from "./useJourneyMarks";
import { ThemeToggleButton } from "../LightModeToggle";

/**
 * The BOTTOM-RIGHT corner — the EXIT and the settings, one row (ADR-059
 * Update 3; U1 had settings here alone, U2 gave it five destination marks).
 *
 * Reading order: Contact · session mark · theme switch. The journey's other
 * six sections went to the top-left, so this corner is where you LEAVE —
 * the last section, then the controls, with the switch anchoring the frame
 * line. New icons join to the LEFT of the switch; see the note in the JSX.
 *
 * §2's "the corner cannot hold both a cluster and a control" was measured
 * against a glyph row that still carried LABELS (~36px against a ~26px
 * strip); U1 dropped those, and a bare 16px glyph row fits beside a control
 * on the same line with room over.
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
 * The exit marks — one, `contact`.
 *
 * Gated on `RAIL_INSTRUMENTS` rather than on `SETTINGS_CLUSTER`: these are
 * journey marks, and flipping the instruments off must take them with it
 * while leaving the theme switch — the site's only theme affordance —
 * exactly where it was. That is the whole reason the two flags are separate.
 */
function ExitMarks() {
  const { activeIdx, seat } = useJourneyMarks(true);

  return (
    <span className="rin-settings__row" aria-hidden="true">
      <MarkRow marks={EXIT_MARKS} activeIdx={activeIdx} seat={seat} />
    </span>
  );
}

export function SettingsCluster() {
  return (
    <div className="rin-settings" data-rin-settings>
      {/* ⚠ THE THEME SWITCH IS THE ANCHOR, AND IT STAYS LAST (owner,
          2026-08-03): it holds the frame line at the outboard end, and
          ANYTHING ADDED TO THIS CORNER GOES TO ITS LEFT. That is a standing
          rule, not this arrangement's detail — the switch is the one
          control here that predates the instruments and the only one on
          every viewport, so it is the fixed point a reader learns.

          Marks inboard, controls outboard, one group gap between them. The
          gap is doing real work: a dim `ahead` glyph immediately beside a
          control reads as a DISABLED control (owner spotted it in the U3
          arrangement, where the switch led the row and the mark sat flush
          against it). Grouping is what says these are different kinds of
          object. */}
      {RAIL_INSTRUMENTS && <ExitMarks />}
      <span className="rin-settings__ctl">
        <SessionMark />
        <ThemeToggleButton />
      </span>
    </div>
  );
}
