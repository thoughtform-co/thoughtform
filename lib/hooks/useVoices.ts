import { useState, useEffect } from "react";
import type { ManifestoVoice } from "@/app/api/voices/route";

interface VideoCard {
  id: string;
  videoUrl: string;
  thumbnail?: string;
  title: string;
  description: string;
  fullText?: string;
  role?: string;
  type?: string;
}

// Fallback data when API is not available
const FALLBACK_CARDS: VideoCard[] = [
  {
    id: "fallback-1",
    videoUrl: "",
    thumbnail: "",
    title: "AI as Intelligence",
    description: "It leaps across dimensions we can't fathom.",
    fullText:
      "AI isn't just a tool—it's a strange, new intelligence that leaps across dimensions we can't fully comprehend. It sees patterns in places we've never looked.",
    role: "Manifesto",
    type: "Voice",
  },
  {
    id: "fallback-2",
    videoUrl: "",
    thumbnail: "",
    title: "Navigate Strangeness",
    description: "The source of truly novel ideas.",
    fullText:
      "In technical work, AI's strangeness must be constrained. But in creative and strategic work, that strangeness becomes the source of truly novel ideas.",
    role: "Manifesto",
    type: "Voice",
  },
  {
    id: "fallback-3",
    videoUrl: "",
    thumbnail: "",
    title: "Think WITH AI",
    description: "Navigating its strangeness for creative breakthroughs.",
    fullText:
      "Thoughtform teaches teams to think WITH that intelligence—not against it, not around it—navigating its strangeness for creative breakthroughs.",
    role: "Manifesto",
    type: "Voice",
  },
];

/**
 * Transform API voice data to VideoCard format
 */
function transformVoiceToCard(voice: ManifestoVoice): VideoCard {
  return {
    id: voice.id,
    videoUrl: voice.video_url || "",
    thumbnail: voice.thumbnail_url || "",
    title: voice.title,
    description: voice.description || "",
    fullText: voice.full_text || "",
    role: voice.role || "Manifesto",
    type: voice.type || "Voice",
  };
}

interface UseVoicesResult {
  cards: VideoCard[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch manifesto voices from the API
 * Returns VideoCard[] format compatible with ManifestoVideoStack
 */
export function useVoices(): UseVoicesResult {
  const [cards, setCards] = useState<VideoCard[]>(FALLBACK_CARDS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/voices");
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();

      if (data.voices && data.voices.length > 0) {
        const transformedCards = data.voices.map(transformVoiceToCard);
        setCards(transformedCards);
      } else {
        // Use fallback if no voices in database
        setCards(FALLBACK_CARDS);
      }
    } catch (err) {
      console.error("[useVoices] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load voices");
      // Keep fallback cards on error
      setCards(FALLBACK_CARDS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  return {
    cards,
    isLoading,
    error,
    refetch: fetchVoices,
  };
}
