"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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

// localStorage keys
const LOCAL_STORAGE_KEY = "thoughtform-particle-config";
const PRESETS_STORAGE_KEY = "thoughtform-gateway-presets";

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
    console.warn("Failed to save to localStorage:", err);
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
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    
    // Migrate legacy presets (old format had 'gateway' instead of 'config')
    return parsed.map((preset: Record<string, unknown>) => {
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
  } catch {
    return [];
  }
};

const savePresetsToStorage = (presets: ConfigPreset[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn("Failed to save presets:", err);
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

const ParticleConfigContext = createContext<ParticleConfigContextValue | null>(
  null
);

interface ParticleConfigProviderProps {
  children: React.ReactNode;
}

export function ParticleConfigProvider({
  children,
}: ParticleConfigProviderProps) {
  const [config, setConfig] = useState<ParticleSystemConfig>(DEFAULT_CONFIG);
  const [savedConfig, setSavedConfig] =
    useState<ParticleSystemConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<"server" | "local">("server");
  const [presets, setPresets] = useState<ConfigPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load presets and active preset on mount
  useEffect(() => {
    setPresets(getPresets());
    setActivePresetId(getActivePresetId());
  }, []);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedConfig);
  }, [config, savedConfig]);

  // Load config from server on mount, with localStorage fallback
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // First, check localStorage for any saved config
    const localConfig = getLocalStorage();
    
    try {
      const response = await fetch("/api/particles/config");
      if (response.ok) {
        const data = await response.json();
        // If server returned defaults but we have local config, use local
        if (localConfig && data.version === DEFAULT_CONFIG.version) {
          setConfig(localConfig);
          setSavedConfig(localConfig);
          setStorageMode("local");
        } else {
          setConfig(data);
          setSavedConfig(data);
          setStorageMode("server");
        }
      } else {
        throw new Error("Failed to load configuration");
      }
    } catch (err) {
      console.error("Failed to load particle config from server:", err);
      // Use localStorage config if available, otherwise defaults
      if (localConfig) {
        setConfig(localConfig);
        setSavedConfig(localConfig);
      } else {
        setConfig(DEFAULT_CONFIG);
        setSavedConfig(DEFAULT_CONFIG);
      }
      setStorageMode("local");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Update entire config
  const updateConfig = useCallback(
    (updates: Partial<ParticleSystemConfig>) => {
      setConfig((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    []
  );

  // Update manifold settings
  const updateManifold = useCallback((updates: Partial<ManifoldConfig>) => {
    setConfig((prev) => ({
      ...prev,
      manifold: {
        ...prev.manifold,
        ...updates,
      },
    }));
  }, []);

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
  const updateLandmark = useCallback(
    (id: string, updates: Partial<LandmarkConfig>) => {
      setConfig((prev) => ({
        ...prev,
        landmarks: prev.landmarks.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      }));
    },
    []
  );

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
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setSavedConfig(data.config);
        setStorageMode("server");
        // Also save to localStorage as backup
        setLocalStorage(data.config);
        return true;
      } else {
        const errorData = await response.json();
        // If KV not configured, fall back to localStorage
        if (errorData.error === "Vercel KV not configured" || response.status === 503) {
          setLocalStorage(configToSave);
          setConfig(configToSave);
          setSavedConfig(configToSave);
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
      setLocalStorage(configToSave);
      setConfig(configToSave);
      setSavedConfig(configToSave);
      setStorageMode("local");
      setError("Saved locally (server unavailable)");
      return true;
    }
  }, [config]);

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    setError(null);
    
    // Always clear localStorage
    clearLocalStorage();
    
    try {
      const response = await fetch("/api/particles/config", {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setSavedConfig(data.config);
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
  }, []);

  // Reload config from server
  const reloadConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  // Toggle preview mode
  const setPreviewMode = useCallback((enabled: boolean) => {
    setIsPreviewMode(enabled);
  }, []);

  // Create a new preset from current config
  const createPreset = useCallback((name: string) => {
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
  }, [config, presets]);

  // Save to active preset, or create new if name provided
  const saveToPreset = useCallback((name?: string) => {
    if (activePresetId) {
      // Update existing preset
      const updatedPresets = presets.map(p => 
        p.id === activePresetId 
          ? { ...p, config: { ...config }, updatedAt: Date.now() }
          : p
      );
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      setSavedConfig(config);
    } else if (name) {
      // Create new preset
      createPreset(name);
    }
  }, [activePresetId, config, presets, createPreset]);

  // Load a preset (makes it active)
  const loadPreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
      // Merge with defaults to ensure all fields exist (handles legacy/incomplete presets)
      const fullConfig = mergeWithDefaults(preset.config || {});
      setConfig(fullConfig);
      setSavedConfig(fullConfig);
      setActivePresetId(id);
      saveActivePresetId(id);
    }
  }, [presets]);

  // Delete a preset
  const deletePreset = useCallback((id: string) => {
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
    // If deleting active preset, clear active
    if (activePresetId === id) {
      setActivePresetId(null);
      saveActivePresetId(null);
    }
  }, [presets, activePresetId]);

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

  return (
    <ParticleConfigContext.Provider value={value}>
      {children}
    </ParticleConfigContext.Provider>
  );
}

/**
 * Hook to access particle config context
 */
export function useParticleConfig(): ParticleConfigContextValue {
  const context = useContext(ParticleConfigContext);
  if (!context) {
    throw new Error(
      "useParticleConfig must be used within a ParticleConfigProvider"
    );
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

