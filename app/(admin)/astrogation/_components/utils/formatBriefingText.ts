// ═══════════════════════════════════════════════════════════════
// FORMAT BRIEFING TEXT - Extract concise summary from markdown briefing
// ═══════════════════════════════════════════════════════════════

/**
 * Converts markdown briefing to concise plain text.
 * Extracts Reference Summary and first few Key Visual Elements.
 */
export function formatBriefingText(markdown: string | null | undefined): string {
  if (!markdown) return "";

  // Extract Reference Summary section (most important)
  const summaryMatch = markdown.match(/##\s*Reference Summary\s*\n([\s\S]*?)(?=\n##|$)/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";

  // Extract first 2-3 key visual elements
  const keyElementsMatch = markdown.match(/##\s*Key Visual Elements\s*\n([\s\S]*?)(?=\n##|$)/i);
  let keyElements = "";
  if (keyElementsMatch) {
    const elements = keyElementsMatch[1]
      .split(/\n/)
      .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("*"))
      .slice(0, 3) // Take first 3 bullets
      .map((line) => line.replace(/^[\s]*[-*]\s+/, "").trim())
      .filter((line) => line.length > 0);
    keyElements = elements.length > 0 ? "\n\n" + elements.map((el) => `• ${el}`).join("\n") : "";
  }

  // Combine summary + key elements
  let concise = summary;
  if (keyElements) {
    concise += keyElements;
  }

  // If no summary found, fall back to first paragraph of the briefing
  if (!concise.trim()) {
    // Remove all markdown formatting and get first meaningful paragraph
    let text = markdown.replace(/^#{1,6}\s+/gm, "");
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
    text = text.replace(/\*([^*]+)\*/g, "$1");
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    text = text.replace(/```[\s\S]*?```/g, "");
    text = text.replace(/`([^`]+)`/g, "$1");

    const firstParagraph = text.split("\n\n").find((p) => p.trim().length > 50);
    concise = firstParagraph ? firstParagraph.trim() : text.substring(0, 200).trim();
  }

  // Clean up extra whitespace
  concise = concise.replace(/\n{3,}/g, "\n\n").trim();

  return concise;
}
