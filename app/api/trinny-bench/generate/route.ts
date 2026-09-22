import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api/guards";

import { devOnly, newJobId, runDetached } from "../_lib/bench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = /^[a-z0-9-]{1,40}$/;

/** Start a generate job: draw one slot, then measure and grade it. Returns
 *  the job id at once; the page polls `job/<id>`. */
export async function POST(request: NextRequest) {
  const gate = devOnly();
  if (gate) return gate;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("body must be JSON", 400, "bench_body");
  }
  const subject = String(body.subject ?? "");
  const type = String(body.type ?? "");
  const lane = body.lane ? String(body.lane) : "";
  const setting = body.setting ? String(body.setting) : "default";
  if (
    !KEY.test(subject) ||
    !/^[A-Z]{1,3}$/.test(type) ||
    (lane && !KEY.test(lane)) ||
    !KEY.test(setting)
  ) {
    return jsonError("subject, type, lane and setting must be short keys", 400, "bench_args");
  }
  const id = newJobId();
  const args = [
    "generate",
    "--job",
    id,
    "--subject",
    subject,
    "--type",
    type,
    "--setting",
    setting,
  ];
  if (lane) args.push("--lane", lane);
  if (body.offline) args.push("--offline");
  if (body.dry_run) args.push("--dry-run");
  runDetached(args);
  return jsonSuccess({ job: id });
}
