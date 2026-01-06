import sharp from "sharp";

export type AnthropicImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

// Anthropic enforces a 5MB maximum on the base64 payload itself (not the decoded bytes).
// Base64 expands binary by ~4/3, so we must keep the encoded string <= 5MB.
const MAX_BASE64_BYTES_DEFAULT = 5 * 1024 * 1024; // 5MB

function coerceMediaType(input?: string | null): AnthropicImageMediaType {
  switch (input) {
    case "image/jpeg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      return input;
    default:
      return "image/png";
  }
}

export async function prepareImageForAnthropic(options: {
  buffer: Buffer;
  mediaType?: string | null;
  maxBase64Bytes?: number;
}): Promise<{
  base64: string;
  mediaType: AnthropicImageMediaType;
  bytes: number;
  wasResized: boolean;
}> {
  const maxBase64Bytes = options.maxBase64Bytes ?? MAX_BASE64_BYTES_DEFAULT;
  const originalMediaType = coerceMediaType(options.mediaType);

  const base64SizeBytes = (binaryBytes: number) => Math.ceil(binaryBytes / 3) * 4;

  // Fast path: already within limit.
  if (base64SizeBytes(options.buffer.length) <= maxBase64Bytes) {
    return {
      base64: options.buffer.toString("base64"),
      mediaType: originalMediaType,
      bytes: options.buffer.length,
      wasResized: false,
    };
  }

  const input = options.buffer;

  // Try to estimate a good starting width based on metadata.
  let targetWidth = 1600;
  try {
    const meta = await sharp(input).metadata();
    if (typeof meta.width === "number" && Number.isFinite(meta.width) && meta.width > 0) {
      targetWidth = Math.min(meta.width, targetWidth);
    }
  } catch {
    // If metadata fails, keep default targetWidth.
  }

  let quality = 80;

  // Iteratively downscale / compress until under the limit.
  for (let attempt = 0; attempt < 12; attempt++) {
    const out = await sharp(input)
      .rotate()
      .resize({ width: targetWidth, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (base64SizeBytes(out.length) <= maxBase64Bytes) {
      return {
        base64: out.toString("base64"),
        mediaType: "image/jpeg",
        bytes: out.length,
        wasResized: true,
      };
    }

    // Tune compression first, then downscale width.
    if (quality > 50) {
      quality -= 10;
    } else if (targetWidth > 700) {
      targetWidth = Math.floor(targetWidth * 0.85);
    } else if (targetWidth > 360) {
      targetWidth = Math.floor(targetWidth * 0.8);
    } else {
      break;
    }
  }

  throw new Error("Image exceeds the 5MB maximum even after compression.");
}
