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
import {
  DEFAULT_CONFIG,
  mergeWithDefaults,
  type ParticleSystemConfig,
  type ManifoldConfig,
  type LandmarkConfig,
  type GatewayConfig,
  type CameraConfig,
  type SigilConfig,
} from "@/lib/particle-config";
import { logger } from "@/lib/logger";
import { useAuth } from "@/components/auth/AuthProvider";

// localStorage keys
const LOCAL_STORAGE_KEY = "thoughtform-particle-config";
const PRESETS_STORAGE_KEY = "thoughtform-particle-presets";
const LEGACY_PRESETS_STORAGE_KEY = "thoughtform-gateway-presets";

// Preset type - stores entire configuration
export interface ConfigPreset {
  id: string;
  name: string;
  config: ParticleSystemConfig;
  createdAt: number;
  updatedAt: number;
}

// Helper to safely access localStorage
const getLocalStorage = (): ParticleSystemConfig | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setLocalStorage = (config: ParticleSystemConfig): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    logger.warn("Failed to save to localStorage:", err);
  }
};

const clearLocalStorage = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Ignore
  }
};

// Preset storage functions
const getPresets = (): ConfigPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored =
      localStorage.getItem(PRESETS_STORAGE_KEY) || localStorage.getItem(LEGACY_PRESETS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Migrate legacy presets (old format had 'gateway' instead of 'config')
    const migrated = parsed.map((preset: Record<string, unknown>) => {
      if (preset.config) {
        return preset as unknown as ConfigPreset;
      }
      // Legacy preset - convert
      if (preset.gateway) {
        return {
          id: preset.id as string,
          name: preset.name as string,
          config: {
            ...DEFAULT_CONFIG,
            gateway: preset.gateway as GatewayConfig,
          },
          createdAt: (preset.createdAt as number) || Date.now(),
          updatedAt: (preset.updatedAt as number) || Date.now(),
        } as ConfigPreset;
      }
      // Fallback: assume it's a valid preset structure
      return preset as unknown as ConfigPreset;
    });

    // If we loaded from legacy key, write back to new key for next time
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(migrated));
    } catch {
      // Ignore
    }

    return migrated;
  } catch {
    return [];
  }
};

const savePresetsToStorage = (presets: ConfigPreset[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    // Keep legacy key in sync for backwards compatibility
    localStorage.setItem(LEGACY_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    logger.warn("Failed to save presets:", err);
  }
};

const ACTIVE_PRESET_KEY = "thoughtform-active-preset";

const getActivePresetId = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_PRESET_KEY);
  } catch {
    return null;
  }
};

const saveActivePresetId = (id: string | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PRESET_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PRESET_KEY);
    }
  } catch {
    // Ignore
  }
};

interface ParticleConfigContextValue {
  /** Current configuration */
  config: ParticleSystemConfig;
  /** Whether config is loading from server */
  isLoading: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Whether the user is in admin/preview mode */
  isPreviewMode: boolean;
  /** Error message if any */
  error: string | null;
  /** Storage mode: 'server' (KV) or 'local' (localStorage fallback) */
  storageMode: "server" | "local";
  /** Update the entire config (for preview) */
  updateConfig: (config: Partial<ParticleSystemConfig>) => void;
  /** Update manifold settings */
  updateManifold: (manifold: Partial<ManifoldConfig>) => void;
  /** Update gateway settings */
  updateGateway: (gateway: Partial<GatewayConfig>) => void;
  /** Update camera settings */
  updateCamera: (camera: Partial<CameraConfig>) => void;
  /** Update sigil settings */
  updateSigil: (sigil: Partial<SigilConfig>) => void;
  /** Update a specific landmark */
  updateLandmark: (id: string, updates: Partial<LandmarkConfig>) => void;
  /** Add a new landmark */
  addLandmark: (landmark: LandmarkConfig) => void;
  /** Remove a landmark */
  removeLandmark: (id: string) => void;
  /** Save current config to server */
  saveConfig: () => Promise<boolean>;
  /** Reset to defaults */
  resetToDefaults: () => Promise<boolean>;
  /** Reload config from server */
  reloadConfig: () => Promise<void>;
  /** Toggle preview mode */
  setPreviewMode: (enabled: boolean) => void;
  /** Configuration presets */
  presets: ConfigPreset[];
  /** Currently active preset ID */
  activePresetId: string | null;
  /** Save current config - updates active preset or creates new one */
  saveToPreset: (name?: string) => void;
  /** Load a preset (makes it active) */
  loadPreset: (id: string) => void;
  /** Delete a preset */
  deletePreset: (id: string) => void;
  /** Create a new preset from current config */
  createPreset: (name: string) => void;
}

const ParticleConfigContext = createContext<ParticleConfigContextValue | null>(null);

interface ParticleConfigProviderProps {
  children: React.ReactNode;
}

export function ParticleConfigProvider({ children }: ParticleConfigProviderProps) {
  const { user, session } = useAuth();
  const [config, setConfig] = useState<ParticleSystemConfig>(DEFAULT_CONFIG);
  const [savedConfig, setSavedConfig] = useState<ParticleSystemConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<"server" | "local">("server");
  const [presets, setPresets] = useState<ConfigPreset[]>(() => getPresets());
  const [activePresetId, setActivePresetId] = useState<string | null>(() => getActivePresetId());

  // After the base config loads, if an active preset exists, apply it automatically.
  // This makes presets feel persistent across refresh (the selected preset becomes the world).
  const didHydrateFromPresetRef = useRef(false);
  useEffect(() => {
    if (didHydrateFromPresetRef.current) return;
    if (isLoading) return;

    if (!activePresetId) {
      // No active preset to apply
      didHydrateFromPresetRef.current = true;
      return;
    }

    const preset = presets.find((p) => p.id === activePresetId);
    if (!preset) {
      // Active preset missing → clear it
      setActivePresetId(null);
      saveActivePresetId(null);
      didHydrateFromPresetRef.current = true;
      return;
    }

    const fullConfig = mergeWithDefaults(preset.config || {});
    setConfig(fullConfig);
    setSavedConfig(fullConfig);
    didHydrateFromPresetRef.current = true;
  }, [isLoading, activePresetId, presets]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedConfig);
  }, [config, savedConfig]);

  // Load config from server on mount, with server API and localStorage fallback
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Priority order: Server API (uses Supabase server-side) > localStorage > defaults
    let loadedConfig: ParticleSystemConfig | null = null;
    let loadedFrom: "server" | "local" = "local";

    // 1. Try server API first (which uses Supabase server-side with service role key)
    // Only load user-specific config if user is logged in
    try {
      const url = user?.id ? `/api/particles/config?userId=${user.id}` : "/api/particles/config";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        loadedConfig = mergeWithDefaults(data);
        loadedFrom = "server";
      }
    } catch (err) {
      logger.warn("Failed to load from server API:", err);
    }

    // 2. If server API failed, try localStorage
    if (!loadedConfig) {
      const localConfigRaw = getLocalStorage();
      if (localConfigRaw) {
        loadedConfig = mergeWithDefaults(localConfigRaw);
        loadedFrom = "local";
      }
    }

    // 3. Fallback to defaults
    if (!loadedConfig) {
      loadedConfig = DEFAULT_CONFIG;
      loadedFrom = "local";
    }

    setConfig(loadedConfig);
    setSavedConfig(loadedConfig);
    setStorageMode(loadedFrom === "server" ? "server" : "local");
    setIsLoading(false);
  }, [user?.id]);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const serverSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save to localStorage (immediate, debounced)
  const autoSaveToLocalStorage = useCallback((configToSave: ParticleSystemConfig) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      const mergedConfig = mergeWithDefaults(configToSave);
      setLocalStorage(mergedConfig);
    }, 300); // 300ms debounce for localStorage
  }, []);

  // Auto-save to server API (which uses Supabase server-side, less frequent, debounced longer)
  const autoSaveToServer = useCallback(
    async (configToSave: ParticleSystemConfig) => {
      // Only save if user is logged in
      if (!user?.id) return;

      if (serverSaveTimerRef.current) {
        clearTimeout(serverSaveTimerRef.current);
      }
      serverSaveTimerRef.current = setTimeout(async () => {
        try {
          const mergedConfig = mergeWithDefaults(configToSave);
          const response = await fetch("/api/particles/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...mergedConfig,
              userId: user.id,
            }),
          });

          if (!response.ok) {
            logger.warn("Failed to auto-save to server:", response.statusText);
          }
        } catch (err) {
          logger.warn("Server auto-save error:", err);
        }
      }, 2000); // 2s debounce for server API
    },
    [user?.id]
  );

  useEffect(() => {
    loadConfig();

    // Cleanup timers on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (serverSaveTimerRef.current) {
        clearTimeout(serverSaveTimerRef.current);
      }
    };
  }, [loadConfig]);

  // Update entire config
  const updateConfig = useCallback(
    (updates: Partial<ParticleSystemConfig>) => {
      setConfig((prev) => {
        const newConfig = { ...prev, ...updates };
        // Auto-save to localStorage
        autoSaveToLocalStorage(newConfig);
        // Auto-save to server API (uses Supabase server-side)
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToLocalStorage, autoSaveToServer]
  );

  // Update manifold settings
  const updateManifold = useCallback(
    (updates: Partial<ManifoldConfig>) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          manifold: {
            ...prev.manifold,
            ...updates,
          },
        };
        // Auto-save to localStorage immediately
        autoSaveToLocalStorage(newConfig);
        // Auto-save to server API (uses Supabase server-side, debounced)
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToLocalStorage, autoSaveToServer]
  );

  // Update gateway settings
  const updateGateway = useCallback((updates: Partial<GatewayConfig>) => {
    setConfig((prev) => ({
      ...prev,
      gateway: {
        ...prev.gateway,
        ...updates,
      },
    }));
  }, []);

  // Update camera settings
  const updateCamera = useCallback((updates: Partial<CameraConfig>) => {
    setConfig((prev) => ({
      ...prev,
      camera: {
        ...prev.camera,
        ...updates,
      },
    }));
  }, []);

  // Update sigil settings
  const updateSigil = useCallback((updates: Partial<SigilConfig>) => {
    setConfig((prev) => ({
      ...prev,
      sigil: {
        ...prev.sigil,
        ...updates,
      },
    }));
  }, []);

  // Update a specific landmark
  const updateLandmark = useCallback((id: string, updates: Partial<LandmarkConfig>) => {
    setConfig((prev) => ({
      ...prev,
      landmarks: prev.landmarks.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  }, []);

  // Add a new landmark
  const addLandmark = useCallback((landmark: LandmarkConfig) => {
    setConfig((prev) => ({
      ...prev,
      landmarks: [...prev.landmarks, landmark],
    }));
  }, []);

  // Remove a landmark
  const removeLandmark = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      landmarks: prev.landmarks.filter((l) => l.id !== id),
    }));
  }, []);

  // Save config to server (with localStorage fallback)
  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !session?.access_token) {
      setError("You must be logged in to save configuration");
      return false;
    }

    setError(null);

    // Prepare config with incremented version
    const configToSave = {
      ...config,
      version: (config.version || 0) + 1,
    };

    try {
      const response = await fetch("/api/particles/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...configToSave,
          userId: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Merge with defaults to ensure all fields exist
        const savedConfig = mergeWithDefaults(data.config);
        setConfig(savedConfig);
        setSavedConfig(savedConfig);
        setStorageMode("server");
        // Also save to localStorage as backup
        setLocalStorage(savedConfig);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save configuration");
        // If KV not configured, fall back to localStorage
        if (errorData.error === "Vercel KV not configured" || response.status === 503) {
          // Ensure config is merged with defaults before saving
          const mergedConfig = mergeWithDefaults(configToSave);
          setLocalStorage(mergedConfig);
          setConfig(mergedConfig);
          setSavedConfig(mergedConfig);
          setStorageMode("local");
          setError("Saved locally (KV not configured)");
          return true;
        }
        setError(errorData.error || "Failed to save");
        return false;
      }
    } catch (err) {
      console.error("Failed to save particle config:", err);
      // Fall back to localStorage on network error
      // Ensure config is merged with defaults before saving
      const mergedConfig = mergeWithDefaults(configToSave);
      setLocalStorage(mergedConfig);
      setConfig(mergedConfig);
      setSavedConfig(mergedConfig);
      setStorageMode("local");
      setError("Saved locally (server unavailable)");
      return true;
    }
  }, [config, session?.access_token, user?.id]);

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !session?.access_token) {
      setError("You must be logged in to reset configuration");
      return false;
    }

    setError(null);

    // Always clear localStorage
    clearLocalStorage();

    try {
      const response = await fetch(`/api/particles/config?userId=${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Merge with defaults to ensure all fields exist
        const resetConfig = mergeWithDefaults(data.config);
        setConfig(resetConfig);
        setSavedConfig(resetConfig);
        setStorageMode("server");
        return true;
      } else {
        // If server reset fails, just reset locally
        setConfig(DEFAULT_CONFIG);
        setSavedConfig(DEFAULT_CONFIG);
        setStorageMode("local");
        return true;
      }
    } catch (err) {
      // Reset locally on network error
      setConfig(DEFAULT_CONFIG);
      setSavedConfig(DEFAULT_CONFIG);
      setStorageMode("local");
      return true;
    }
  }, [user?.id, session?.access_token]);

  // Reload config from server
  const reloadConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  // Toggle preview mode
  const setPreviewMode = useCallback((enabled: boolean) => {
    setIsPreviewMode(enabled);
  }, []);

  // Create a new preset from current config
  const createPreset = useCallback(
    (name: string) => {
      const newPreset: ConfigPreset = {
        id: `preset-${Date.now()}`,
        name,
        config: { ...config },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      setActivePresetId(newPreset.id);
      saveActivePresetId(newPreset.id);
      setSavedConfig(config);
    },
    [config, presets]
  );

  // Save to active preset, or create new if name provided
  const saveToPreset = useCallback(
    (name?: string) => {
      if (activePresetId) {
        // Update existing preset
        const updatedPresets = presets.map((p) =>
          p.id === activePresetId ? { ...p, config: { ...config }, updatedAt: Date.now() } : p
        );
        setPresets(updatedPresets);
        savePresetsToStorage(updatedPresets);
        setSavedConfig(config);
      } else if (name) {
        // Create new preset
        createPreset(name);
      }
    },
    [activePresetId, config, presets, createPreset]
  );

  // Load a preset (makes it active)
  const loadPreset = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      if (preset) {
        // Merge with defaults to ensure all fields exist (handles legacy/incomplete presets)
        const fullConfig = mergeWithDefaults(preset.config || {});
        setConfig(fullConfig);
        setSavedConfig(fullConfig);
        setActivePresetId(id);
        saveActivePresetId(id);
      }
    },
    [presets]
  );

  // Delete a preset
  const deletePreset = useCallback(
    (id: string) => {
      const updatedPresets = presets.filter((p) => p.id !== id);
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      // If deleting active preset, clear active
      if (activePresetId === id) {
        setActivePresetId(null);
        saveActivePresetId(null);
      }
    },
    [presets, activePresetId]
  );

  const value = useMemo(
    () => ({
      config,
      isLoading,
      hasChanges,
      isPreviewMode,
      error,
      storageMode,
      updateConfig,
      updateManifold,
      updateGateway,
      updateCamera,
      updateSigil,
      updateLandmark,
      addLandmark,
      removeLandmark,
      saveConfig,
      resetToDefaults,
      reloadConfig,
      setPreviewMode,
      presets,
      activePresetId,
      saveToPreset,
      loadPreset,
      deletePreset,
      createPreset,
    }),
    [
      config,
      isLoading,
      hasChanges,
      isPreviewMode,
      error,
      storageMode,
      updateConfig,
      updateManifold,
      updateGateway,
      updateCamera,
      updateSigil,
      updateLandmark,
      addLandmark,
      removeLandmark,
      saveConfig,
      resetToDefaults,
      reloadConfig,
      setPreviewMode,
      presets,
      activePresetId,
      saveToPreset,
      loadPreset,
      deletePreset,
      createPreset,
    ]
  );

  return <ParticleConfigContext.Provider value={value}>{children}</ParticleConfigContext.Provider>;
}

/**
 * Hook to access particle config context
 */
export function useParticleConfig(): ParticleConfigContextValue {
  const context = useContext(ParticleConfigContext);
  if (!context) {
    throw new Error("useParticleConfig must be used within a ParticleConfigProvider");
  }
  return context;
}

/**
 * Hook that returns just the config (for components that only need to read)
 */
export function useParticleSystemConfig(): ParticleSystemConfig {
  const { config } = useParticleConfig();
  return config;
}
