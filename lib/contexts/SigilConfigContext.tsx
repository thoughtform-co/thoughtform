"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { resolveSigilShape, getDefaultSigilShape } from "@/lib/sigil-geometries";
import { logger } from "@/lib/logger";
import { useAuth } from "@/components/auth/AuthProvider";

// ═══════════════════════════════════════════════════════════════════
// SIGIL CONFIG CONTEXT
// Manages sigil configurations for the 3 service cards
// Now supports new Thoughtform shapes with legacy fallback
// ═══════════════════════════════════════════════════════════════════

export interface SigilConfig {
  shape: string; // Now accepts any shape from registry (with fallback)
  particleCount: number;
  color: string; // RGB format: "202, 165, 84"
  /** Sigil size in pixels (default 140, max ~400 for full bleed) */
  size?: number;
  /** Horizontal offset as percentage (-50 to 50, default 0 = centered) */
  offsetX?: number;
  /** Vertical offset as percentage (-50 to 50, default 0 = centered) */
  offsetY?: number;
  animationParams: {
    drift?: number;
    pulse?: number;
    glitch?: number;
  };
}

/** Default sigil size in pixels */
export const DEFAULT_SIGIL_SIZE = 140;

export const DEFAULT_SIGIL_CONFIG: SigilConfig = {
  shape: "tf_filamentField", // New Thoughtform default
  particleCount: 200,
  color: "202, 165, 84",
  size: DEFAULT_SIGIL_SIZE,
  animationParams: {
    drift: 1,
    pulse: 1,
    glitch: 0.1,
  },
};

// Default configs for the 3 cards - using new Thoughtform shapes
export const DEFAULT_SIGIL_CONFIGS: SigilConfig[] = [
  { ...DEFAULT_SIGIL_CONFIG, shape: "tf_constellationMesh" }, // Inspire: networked constellation
  { ...DEFAULT_SIGIL_CONFIG, shape: "tf_trefoilKnot" }, // Practice: interconnected knot
  { ...DEFAULT_SIGIL_CONFIG, shape: "tf_vortexBloom" }, // Transform: blooming vortex
];

interface SigilConfigContextValue {
  /** Current configurations for all 3 cards */
  configs: SigilConfig[];
  /** Whether config is loading from server */
  isLoading: boolean;
  /** Whether the user is an admin (can edit) */
  isAdmin: boolean;
  /** Error message if any */
  error: string | null;
  /** Update config for a specific card */
  updateConfig: (cardIndex: number, updates: Partial<SigilConfig>) => void;
  /** Save current configs to server */
  saveConfigs: () => Promise<boolean>;
  /** Reload configs from server */
  reloadConfigs: () => Promise<void>;
}

const SigilConfigContext = createContext<SigilConfigContextValue | null>(null);

interface SigilConfigProviderProps {
  children: React.ReactNode;
}

/**
 * Resolve a config's shape to handle legacy shapes
 */
function resolveConfig(config: Partial<SigilConfig>): SigilConfig {
  const resolvedShape = resolveSigilShape(config.shape || getDefaultSigilShape());
  return {
    ...DEFAULT_SIGIL_CONFIG,
    ...config,
    shape: resolvedShape, // Always use resolved shape
    animationParams: {
      ...DEFAULT_SIGIL_CONFIG.animationParams,
      ...(config.animationParams || {}),
    },
  };
}

export function SigilConfigProvider({ children }: SigilConfigProviderProps) {
  const { user, session } = useAuth();
  const [configs, setConfigs] = useState<SigilConfig[]>(DEFAULT_SIGIL_CONFIGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin check - only logged-in users can edit
  const isAdmin = !!user?.id && !!session?.access_token;

  // Load configs from server (with legacy shape fallback)
  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sigils/config");
      if (response.ok) {
        const data = await response.json();
        if (data.configs && Array.isArray(data.configs) && data.configs.length === 3) {
          // Resolve legacy shapes during load
          setConfigs(data.configs.map((c: Partial<SigilConfig>) => resolveConfig(c)));
        } else {
          setConfigs(DEFAULT_SIGIL_CONFIGS);
        }
      } else {
        // Fallback to defaults
        setConfigs(DEFAULT_SIGIL_CONFIGS);
      }
    } catch (err) {
      logger.warn("Failed to load sigil configs from server:", err);
      setConfigs(DEFAULT_SIGIL_CONFIGS);
    }

    setIsLoading(false);
  }, []);

  // Auto-save debounce timer
  const serverSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save to server (admin only)
  const autoSaveToServer = useCallback(
    async (configsToSave: SigilConfig[]) => {
      if (!isAdmin || !session?.access_token) return;

      if (serverSaveTimerRef.current) {
        clearTimeout(serverSaveTimerRef.current);
      }
      serverSaveTimerRef.current = setTimeout(async () => {
        try {
          const response = await fetch("/api/sigils/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ configs: configsToSave }),
          });

          if (!response.ok) {
            logger.warn("Failed to auto-save sigil configs:", response.statusText);
          }
        } catch (err) {
          logger.warn("Server auto-save error:", err);
        }
      }, 1500); // 1.5s debounce
    },
    [isAdmin, session?.access_token]
  );

  useEffect(() => {
    loadConfigs();

    return () => {
      if (serverSaveTimerRef.current) {
        clearTimeout(serverSaveTimerRef.current);
      }
    };
  }, [loadConfigs]);

  // Update config for a specific card
  const updateConfig = useCallback(
    (cardIndex: number, updates: Partial<SigilConfig>) => {
      if (cardIndex < 0 || cardIndex > 2) return;

      setConfigs((prev) => {
        const newConfigs = prev.map((config, index) => {
          if (index !== cardIndex) return config;

          // Resolve shape if being updated
          const shape = updates.shape ? resolveSigilShape(updates.shape) : config.shape;

          return {
            ...config,
            ...updates,
            shape,
            animationParams: {
              ...config.animationParams,
              ...(updates.animationParams || {}),
            },
          };
        });
        // Auto-save to server
        autoSaveToServer(newConfigs);
        return newConfigs;
      });
    },
    [autoSaveToServer]
  );

  // Save configs to server
  const saveConfigs = useCallback(async (): Promise<boolean> => {
    if (!isAdmin || !session?.access_token) {
      setError("You must be logged in as admin to save configuration");
      return false;
    }

    setError(null);

    try {
      const response = await fetch("/api/sigils/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ configs }),
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save configuration");
        return false;
      }
    } catch (err) {
      console.error("Failed to save sigil configs:", err);
      setError("Failed to save - server unavailable");
      return false;
    }
  }, [configs, isAdmin, session?.access_token]);

  // Reload configs from server
  const reloadConfigs = useCallback(async () => {
    await loadConfigs();
  }, [loadConfigs]);

  const value = useMemo(
    () => ({
      configs,
      isLoading,
      isAdmin,
      error,
      updateConfig,
      saveConfigs,
      reloadConfigs,
    }),
    [configs, isLoading, isAdmin, error, updateConfig, saveConfigs, reloadConfigs]
  );

  return <SigilConfigContext.Provider value={value}>{children}</SigilConfigContext.Provider>;
}

/**
 * Hook to access sigil config context
 */
export function useSigilConfig(): SigilConfigContextValue {
  const context = useContext(SigilConfigContext);
  if (!context) {
    throw new Error("useSigilConfig must be used within a SigilConfigProvider");
  }
  return context;
}

/**
 * Hook that returns just the configs (for components that only need to read)
 */
export function useSigilConfigs(): SigilConfig[] {
  const { configs } = useSigilConfig();
  return configs;
}
