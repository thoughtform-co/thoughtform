#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

function printUsage() {
  console.error(
    [
      "Usage:",
      '  node scripts/optimize-video.mjs <input> <output> [--poster <poster-output>] [--crf <value>] [--preset <value>] [--keep-audio]',
      "",
      "Example:",
      '  node scripts/optimize-video.mjs "public/videos/input.mp4" "public/videos/input-web.mp4" --poster "public/videos/input-poster.jpg"',
    ].join("\n")
  );
}

function run(command, args, { inheritStdout = false } = {}) {
  const result = spawnSync(command, args, {
    stdio: inheritStdout ? "inherit" : "pipe",
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(stderr || `${command} exited with status ${result.status}`);
  }

  return result.stdout?.trim() ?? "";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function percentDelta(from, to) {
  if (from <= 0) return "0.0%";
  return `${(((to - from) / from) * 100).toFixed(1)}%`;
}

const rawArgs = process.argv.slice(2);
if (rawArgs.length < 2) {
  printUsage();
  process.exit(1);
}

const positional = [];
let posterOutput = null;
let crf = "23";
let preset = "slow";
let keepAudio = false;

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];

  if (arg === "--poster") {
    posterOutput = rawArgs[index + 1];
    index += 1;
    continue;
  }

  if (arg === "--crf") {
    crf = rawArgs[index + 1];
    index += 1;
    continue;
  }

  if (arg === "--preset") {
    preset = rawArgs[index + 1];
    index += 1;
    continue;
  }

  if (arg === "--keep-audio") {
    keepAudio = true;
    continue;
  }

  positional.push(arg);
}

const [inputPath, outputPath] = positional;

if (!inputPath || !outputPath) {
  printUsage();
  process.exit(1);
}

if (!existsSync(inputPath)) {
  throw new Error(`Input file not found: ${inputPath}`);
}

if (path.resolve(inputPath) === path.resolve(outputPath)) {
  throw new Error("Input and output paths must be different.");
}

const probeOutput = run("ffprobe", [
  "-v",
  "error",
  "-select_streams",
  "v:0",
  "-show_entries",
  "stream=width,height,avg_frame_rate,codec_name",
  "-show_entries",
  "format=duration,size,bit_rate",
  "-of",
  "json",
  inputPath,
]);

const metadata = JSON.parse(probeOutput);
const stream = metadata.streams?.[0];
const format = metadata.format ?? {};

if (!stream?.width || !stream?.height) {
  throw new Error("Could not determine input video dimensions.");
}

const scaleFilter = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
const ffmpegArgs = [
  "-y",
  "-i",
  inputPath,
  "-map",
  "0:v:0",
  ...(keepAudio ? ["-map", "0:a?"] : ["-an"]),
  "-vf",
  scaleFilter,
  "-c:v",
  "libx264",
  "-preset",
  preset,
  "-crf",
  crf,
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  outputPath,
];

console.log(
  [
    `Optimizing ${inputPath}`,
    `  codec: ${stream.codec_name}`,
    `  resolution: ${stream.width}x${stream.height}`,
    `  duration: ${Number(format.duration ?? 0).toFixed(2)}s`,
    `  source size: ${formatBytes(Number(format.size ?? 0))}`,
    `  target: ${outputPath}`,
  ].join("\n")
);

run("ffmpeg", ffmpegArgs, { inheritStdout: true });

if (posterOutput) {
  run(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-vf",
      scaleFilter,
      "-frames:v",
      "1",
      "-update",
      "1",
      "-q:v",
      "2",
      posterOutput,
    ],
    { inheritStdout: true }
  );
}

const inputSize = statSync(inputPath).size;
const outputSize = statSync(outputPath).size;

console.log(
  [
    "",
    "Done.",
    `  optimized size: ${formatBytes(outputSize)} (${percentDelta(inputSize, outputSize)} vs source)`,
    posterOutput ? `  poster: ${posterOutput}` : null,
  ]
    .filter(Boolean)
    .join("\n")
);
