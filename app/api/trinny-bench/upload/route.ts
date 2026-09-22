import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api/guards";

import { devOnly, newJobId, runDetached } from "../_lib/bench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KEY = /^[a-z0-9-]{1,40}$/;
const TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};
const MAX_BYTES = 40 * 1024 * 1024;

/** Take a dropped image, park it in the OS temp dir, and hand it to the
 *  runner, which moves it into the session on Drive and grades it. */
export async function POST(request: NextRequest) {
  const gate = devOnly();
  if (gate) return gate;
  const form = await request.formData();
  const file = form.get("file");
  const subject = String(form.get("subject") ?? "");
  const type = String(form.get("type") ?? "");
  const offline = String(form.get("offline") ?? "") === "1";
  if (!(file instanceof File)) return jsonError("no file", 400, "bench_file");
  if (!KEY.test(subject) || !/^[A-Z]{1,3}$/.test(type)) {
    return jsonError("subject and type must be short keys", 400, "bench_args");
  }
  const ext = TYPES[file.type];
  if (!ext) return jsonError("PNG, JPEG or WebP only", 415, "bench_type");
  if (file.size > MAX_BYTES) return jsonError("file over 40 MB", 413, "bench_size");

  const id = newJobId();
  const dir = path.join(os.tmpdir(), "trinny-bench");
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `${id}${ext}`);
  await writeFile(tmp, Buffer.from(await file.arrayBuffer()));

  const name = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || `upload${ext}`;
  const args = [
    "upload",
    "--job",
    id,
    "--file",
    tmp,
    "--name",
    name,
    "--subject",
    subject,
    "--type",
    type,
  ];
  if (offline) args.push("--offline");
  runDetached(args);
  return jsonSuccess({ job: id });
}
