"use client";

import { useState, useCallback } from "react";
import type { SurveyItem } from "../_components/types";
import {
  extractDesignTokens,
  tokensToDescription,
  tokensToComponentProps,
  type ExtractedTokens,
} from "../_components/utils";

// ═══════════════════════════════════════════════════════════════
// REFERENCE MATCH HOOK
// Bridges Survey items to Thoughtform MCP component matching
// Inspired by GitHub Next's Mosaic project approach
// ═══════════════════════════════════════════════════════════════

export interface ComponentMatch {
  component: string;
  repo: string;
  platform: string;
  similarity: number;
  patterns: string[];
  tokens: string[];
}

export interface MatchResult {
  query: string;
  matches: ComponentMatch[];
  suggestedTokens: string[];
  suggestedPatterns: string[];
  implementationPath: string[];
  extractedTokens: ExtractedTokens;
  componentProps: Record<string, unknown>;
}

export interface UseReferenceMatchReturn {
  matchReference: (item: SurveyItem, componentId?: string) => Promise<MatchResult | null>;
  matchFromDescription: (description: string, componentId?: string) => Promise<MatchResult | null>;
  isMatching: boolean;
  lastResult: MatchResult | null;
  error: string | null;
}

/**
 * Hook for matching Survey references to Thoughtform components.
 * Extracts design tokens from Survey items and queries the MCP for similar components.
 */
export function useReferenceMatch(): UseReferenceMatchReturn {
  const [isMatching, setIsMatching] = useState(false);
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Match a Survey item to components via MCP
   */
  const matchReference = useCallback(
    async (item: SurveyItem, componentId?: string): Promise<MatchResult | null> => {
      setIsMatching(true);
      setError(null);

      try {
        // 1. Extract design tokens from the Survey item
        const extractedTokens = extractDesignTokens(item);

        // 2. Generate a natural language description for MCP query
        const description = tokensToDescription(extractedTokens);

        // 3. Call the MCP match endpoint
        const response = await fetch("/api/thoughtform/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            limit: 8,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Match request failed: ${response.status}`);
        }

        const mcpResult = await response.json();

        // 4. Generate component props from extracted tokens
        const componentProps = componentId
          ? tokensToComponentProps(extractedTokens, componentId)
          : {};

        // 5. Combine results
        const result: MatchResult = {
          query: description,
          matches: mcpResult.matches || [],
          suggestedTokens: mcpResult.suggestedTokens || [],
          suggestedPatterns: mcpResult.suggestedPatterns || [],
          implementationPath: mcpResult.implementationPath || [],
          extractedTokens,
          componentProps,
        };

        setLastResult(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to match reference";
        setError(message);
        console.error("[useReferenceMatch] Error:", err);
        return null;
      } finally {
        setIsMatching(false);
      }
    },
    []
  );

  /**
   * Match a description directly (without Survey item)
   */
  const matchFromDescription = useCallback(
    async (description: string, componentId?: string): Promise<MatchResult | null> => {
      setIsMatching(true);
      setError(null);

      try {
        // Call the MCP match endpoint directly
        const response = await fetch("/api/thoughtform/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            limit: 8,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Match request failed: ${response.status}`);
        }

        const mcpResult = await response.json();

        // Create a minimal result (no extracted tokens since we don't have a Survey item)
        const result: MatchResult = {
          query: description,
          matches: mcpResult.matches || [],
          suggestedTokens: mcpResult.suggestedTokens || [],
          suggestedPatterns: mcpResult.suggestedPatterns || [],
          implementationPath: mcpResult.implementationPath || [],
          extractedTokens: {
            colors: {
              primary: null,
              accent: null,
              background: null,
              text: null,
              border: null,
              tokenMappings: {},
            },
            typography: {
              family: null,
              weight: null,
              style: null,
              size: null,
              letterSpacing: null,
              casing: null,
            },
            geometry: {
              borderRadius: "none",
              chamferAngle: null,
              chamferCorners: [],
              borderWidth: "thin",
              hasNotch: false,
              notchPosition: null,
            },
            patterns: { patterns: [], confidence: {} },
            mood: {
              primary: "industrial",
              secondary: [],
              warmth: 0,
              density: 0,
              animation: 0,
            },
            sourceFields: {
              tags: [],
              summary: null,
              transferNotes: null,
              hudAffordances: [],
              frames: [],
              annotationNotes: [],
            },
          },
          componentProps: {},
        };

        setLastResult(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to match description";
        setError(message);
        console.error("[useReferenceMatch] Error:", err);
        return null;
      } finally {
        setIsMatching(false);
      }
    },
    []
  );

  return {
    matchReference,
    matchFromDescription,
    isMatching,
    lastResult,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Blend multiple references
// ═══════════════════════════════════════════════════════════════

export interface BlendWeights {
  itemId: string;
  weight: number; // 0-1, all weights should sum to 1
}

/**
 * Blends extracted tokens from multiple Survey items.
 * Useful for creating "60% Starfield + 40% Alien Romulus" style combinations.
 */
export function blendExtractedTokens(
  items: SurveyItem[],
  weights: BlendWeights[]
): ExtractedTokens {
  // Validate weights sum to ~1
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.01) {
    console.warn(`[blendExtractedTokens] Weights sum to ${totalWeight}, normalizing to 1`);
  }

  // Extract tokens from each item
  const tokenSets = items.map((item) => ({
    tokens: extractDesignTokens(item),
    weight: weights.find((w) => w.itemId === item.id)?.weight || 0,
  }));

  // For now, take weighted average of numeric values and majority vote for strings
  // This is a simplified blend - a more sophisticated version would use vector math

  // Find the dominant item (highest weight)
  const dominant = tokenSets.reduce((a, b) => (a.weight > b.weight ? a : b));

  // Blend numeric values (warmth, density, animation)
  let blendedWarmth = 0;
  let blendedDensity = 0;
  let blendedAnimation = 0;

  for (const { tokens, weight } of tokenSets) {
    const normalizedWeight = weight / totalWeight;
    blendedWarmth += tokens.mood.warmth * normalizedWeight;
    blendedDensity += tokens.mood.density * normalizedWeight;
    blendedAnimation += tokens.mood.animation * normalizedWeight;
  }

  // Merge patterns from all items (union with confidence blending)
  const mergedPatterns: Record<string, number> = {};
  for (const { tokens, weight } of tokenSets) {
    const normalizedWeight = weight / totalWeight;
    for (const pattern of tokens.patterns.patterns) {
      const confidence = tokens.patterns.confidence[pattern] || 0.5;
      mergedPatterns[pattern] = (mergedPatterns[pattern] || 0) + confidence * normalizedWeight;
    }
  }

  return {
    // Use dominant item's categorical values
    colors: dominant.tokens.colors,
    typography: dominant.tokens.typography,
    geometry: dominant.tokens.geometry,
    // Blend patterns
    patterns: {
      patterns: Object.keys(mergedPatterns),
      confidence: mergedPatterns,
    },
    // Blend mood values
    mood: {
      primary: dominant.tokens.mood.primary,
      secondary: Array.from(new Set(tokenSets.flatMap((t) => t.tokens.mood.secondary))).slice(0, 4),
      warmth: blendedWarmth,
      density: blendedDensity,
      animation: blendedAnimation,
    },
    // Merge source fields
    sourceFields: {
      tags: Array.from(new Set(tokenSets.flatMap((t) => t.tokens.sourceFields.tags))),
      summary: dominant.tokens.sourceFields.summary,
      transferNotes: dominant.tokens.sourceFields.transferNotes,
      hudAffordances: Array.from(
        new Set(tokenSets.flatMap((t) => t.tokens.sourceFields.hudAffordances))
      ),
      frames: Array.from(new Set(tokenSets.flatMap((t) => t.tokens.sourceFields.frames))),
      annotationNotes: Array.from(
        new Set(tokenSets.flatMap((t) => t.tokens.sourceFields.annotationNotes))
      ),
    },
  };
}
