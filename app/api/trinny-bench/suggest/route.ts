import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api/guards";

import { devOnly, newJobId, runSync } from "../_lib/bench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

/** Which subject a dropped image looks like, by colour band alone. A
 *  suggestion for the picker; the person confirms before anything is graded. */
export async function POST(request: NextRequest) {
  const gate = devOnly();
  if (gate) return gate;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("no file", 400, "bench_file");
  const ext = TYPES[file.type];
  if (!ext) return jsonError("PNG, JPEG or WebP only", 415, "bench_type");
  const dir = path.join(os.tmpdir(), "trinny-bench");
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `suggest-${newJobId()}${ext}`);
  await writeFile(tmp, Buffer.from(await file.arrayBuffer()));
  try {
    return jsonSuccess(await runSync(["suggest", "--file", tmp], 60_000));
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500, "bench_suggest");
  } finally {
    await rm(tmp, { force: true });
  }
}
