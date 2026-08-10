import { DaemoniacShell } from "./DaemoniacShell";

/* Stylesheet order is LOAD-BEARING (the intelligence-config-lab law):
   `landing.css` owns the `@font-face` block and the `:root` token chain,
   `theme.css` follows so the light-theme (parchment) steps win, and the
   lab's own sheet comes last so lab positioning wins over production. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/v7/theme.css";
import "./daemoniac-lab.css";

/**
 * DAEMONIAC — the ritual register look-dev (personal, no ADR).
 *
 * A bind is the drawn record of a configuration: the summoning-circle
 * reading of an agent — what was summoned (the crown), what it is bound
 * to (ring-station seals), and how far it may act alone (the containment
 * ring itself). Every mark is derived from the record by
 * `lib/daemoniac/composeBind`; nothing here is decoration.
 *
 * References: the 13 Daemoniac tome plates (Fernando Forero, Diablo).
 * Canon: the warlock line is summon · bind · send (worldbuilding
 * canon.md — "Recognition, never addition"). "Sigil" stays the brand
 * mark's word (LANGUAGE.md); the drawn object here is a BIND.
 */
export default function DaemoniacLabRoute() {
  return <DaemoniacShell />;
}
