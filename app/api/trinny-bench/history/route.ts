import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api/guards";

import { devOnly, runSync } from "../_lib/bench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** The session's jobs, newest first, trimmed for the history strip.
 *  `?offline=1` lists the day's rehearsal session instead. */
export async function GET(request: NextRequest) {
  const gate = devOnly();
  if (gate) return gate;
  try {
    const offline = request.nextUrl.searchParams.get("offline") === "1";
    return jsonSuccess(await runSync(offline ? ["jobs", "--offline"] : ["jobs"], 60_000));
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500, "bench_history");
  }
}
