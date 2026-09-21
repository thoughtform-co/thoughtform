import "server-only";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  OWNER_PASS_COOKIE,
  decideOwnerGate,
  ownerGateEnforced,
  ownerPassKey,
  type OwnerGateDecision,
} from "./ownerPass";

/**
 * lib/auth/ownerGate — the overview's gate, read IN THE PAGE (ADR-117).
 *
 * ⚠ NOT IN `proxy.ts`. A static `/arcs` behind an exact-path proxy check
 * leaks: the build also emits `arcs.rsc` and `arcs.segments/*.segment.rsc`
 * (measured: the full segment carried every client's name), those URL shapes
 * reach the proxy under a different pathname, and `/%61rcs` resolves to the
 * page under `next start`. A `force-dynamic` page that asks this function
 * first has no prerendered artefact at all, and every transport shape runs
 * the same check — and no path predicate can ever 404 a client's page by
 * mistake.
 */
export async function ownerGate(): Promise<OwnerGateDecision> {
  const enforced = ownerGateEnforced();
  if (!enforced) return "open";
  const jar = await cookies();
  return decideOwnerGate({
    enforced,
    key: ownerPassKey(),
    token: jar.get(OWNER_PASS_COOKIE)?.value,
    nowSec: Math.floor(Date.now() / 1000),
  });
}

/** A stranger gets the site's ordinary 404, never a login prompt. */
export async function assertOwner(): Promise<void> {
  if ((await ownerGate()) === "deny") notFound();
}
