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
  getMobileEffectiveConfig,
  type ParticleSystemConfig,
  type ManifoldConfig,
  type LandmarkConfig,
  type GatewayConfig,
  type CameraConfig,
  type SigilConfig,
} from "@/lib/particle-config";
import { logger } from "@/lib/logger";
import { useAuth } from "@/components/auth/AuthProvider";

// Preset type - stores entire configuration
export interface ConfigPreset {
  id: string;
  name: string;
  config: ParticleSystemConfig;
  createdAt: number;
  updatedAt: number;
}

interface ParticleConfigContextValue {
  /** Current configuration (GLOBAL - same for all visitors) */
  config: ParticleSystemConfig;
  /** Get effective config for mobile (with mobile overrides applied) */
  getMobileConfig: () => ParticleSystemConfig;
  /** Whether config is loading from server */
  isLoading: boolean;
  /** Whether there are unsaved changes (admin only) */
  hasChanges: boolean;
  /** Whether the user is an admin (can edit) */
  isAdmin: boolean;
  /** Error message if any */
  error: string | null;
  /** Update the entire config (admin only - changes visible to all) */
  updateConfig: (config: Partial<ParticleSystemConfig>) => void;
  /** Update manifold settings */
  updateManifold: (manifold: Partial<ManifoldConfig>) => void;
  /** Update gateway settings */
  updateGateway: (gateway: Partial<GatewayConfig>) => void;
  /** Update camera settings */
  updateCamera: (camera: Partial<CameraConfig>) => void;
  /** Update sigil settings */
  updateSigil: (sigil: Partial<SigilConfig>) => void;
  /** Update mobile-specific gateway settings (overrides desktop on mobile) */
  updateMobileGateway: (gateway: Partial<GatewayConfig>) => void;
  /** Update mobile-specific manifold settings (overrides desktop on mobile) */
  updateMobileManifold: (manifold: Partial<ManifoldConfig>) => void;
  /** Update a specific landmark */
  updateLandmark: (id: string, updates: Partial<LandmarkConfig>) => void;
  /** Add a new landmark */
  addLandmark: (landmark: LandmarkConfig) => void;
  /** Remove a landmark */
  removeLandmark: (id: string) => void;
  /** Save current config to server (admin only - pushes to all visitors) */
  saveConfig: () => Promise<boolean>;
  /** Reset to defaults (admin only) */
  resetToDefaults: () => Promise<boolean>;
  /** Reload config from server */
  reloadConfig: () => Promise<void>;
  /** Configuration presets (stored on server) */
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
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<ConfigPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Admin check - only logged-in users can edit
  const isAdmin = !!user?.id && !!session?.access_token;

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedConfig);
  }, [config, savedConfig]);

  // Load GLOBAL config from server on mount (same for all visitors)
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Always load global config (no user-specific config)
      const response = await fetch("/api/particles/config");
      if (response.ok) {
        const data = await response.json();
        const loadedConfig = mergeWithDefaults(data.config || data);
        setConfig(loadedConfig);
        setSavedConfig(loadedConfig);
        setPresets(data.presets || []);
        setActivePresetId(data.activePresetId || null);
      } else {
        // Fallback to defaults
        setConfig(DEFAULT_CONFIG);
        setSavedConfig(DEFAULT_CONFIG);
        setPresets([]);
      }
    } catch (err) {
      logger.warn("Failed to load from server API:", err);
      setConfig(DEFAULT_CONFIG);
      setSavedConfig(DEFAULT_CONFIG);
      setPresets([]);
    }

    setIsLoading(false);
  }, []);

  // Auto-save debounce timer (admin only)
  const serverSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save to server (admin only - pushes to all visitors)
  const autoSaveToServer = useCallback(
    async (
      configToSave: ParticleSystemConfig,
      presetsToSave?: ConfigPreset[],
      activePresetIdToSave?: string | null
    ) => {
      // Only save if user is logged in (admin)
      if (!isAdmin || !session?.access_token) return;

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
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              config: mergedConfig,
              presets: presetsToSave ?? presets,
              activePresetId: activePresetIdToSave ?? activePresetId,
            }),
          });

          if (response.ok) {
            setSavedConfig(mergedConfig);
          } else {
            logger.warn("Failed to auto-save to server:", response.statusText);
          }
        } catch (err) {
          logger.warn("Server auto-save error:", err);
        }
      }, 1500); // 1.5s debounce for server API
    },
    [isAdmin, session?.access_token, presets, activePresetId]
  );

  useEffect(() => {
    loadConfig();

    // Cleanup timer on unmount
    return () => {
      if (serverSaveTimerRef.current) {
        clearTimeout(serverSaveTimerRef.current);
      }
    };
  }, [loadConfig]);

  // Update entire config (admin only - auto-saves to server)
  const updateConfig = useCallback(
    (updates: Partial<ParticleSystemConfig>) => {
      setConfig((prev) => {
        const newConfig = { ...prev, ...updates };
        // Auto-save to server (admin only)
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
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
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Update gateway settings
  const updateGateway = useCallback(
    (updates: Partial<GatewayConfig>) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          gateway: {
            ...prev.gateway,
            ...updates,
          },
        };
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Update camera settings
  const updateCamera = useCallback(
    (updates: Partial<CameraConfig>) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          camera: {
            ...prev.camera,
            ...updates,
          },
        };
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Update sigil settings
  const updateSigil = useCallback(
    (updates: Partial<SigilConfig>) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          sigil: {
            ...prev.sigil,
            ...updates,
          },
        };
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Update mobile-specific gateway settings
  const updateMobileGateway = useCallback(
    (updates: Partial<GatewayConfig>) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          mobileGateway: {
            ...(prev.mobileGateway || {}),
            ...updates,
          },
        };
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Update mobile-specific manifold settings
  const updateMobileManifold = useCallback(
    (updates: Partial<ManifoldConfig>) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          mobileManifold: {
            ...(prev.mobileManifold || {}),
            ...updates,
          },
        };
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Get effective config for mobile (merges mobile overrides with base config)
  const getMobileConfig = useCallback(() => {
    return getMobileEffectiveConfig(config);
  }, [config]);

  // Update a specific landmark
  const updateLandmark = useCallback(
    (id: string, updates: Partial<LandmarkConfig>) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          landmarks: prev.landmarks.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        };
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Add a new landmark
  const addLandmark = useCallback(
    (landmark: LandmarkConfig) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          landmarks: [...prev.landmarks, landmark],
        };
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Remove a landmark
  const removeLandmark = useCallback(
    (id: string) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          landmarks: prev.landmarks.filter((l) => l.id !== id),
        };
        autoSaveToServer(newConfig);
        return newConfig;
      });
    },
    [autoSaveToServer]
  );

  // Save config to server (admin only - pushes to all visitors)
  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!isAdmin || !session?.access_token) {
      setError("You must be logged in as admin to save configuration");
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
          config: configToSave,
          presets,
          activePresetId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const savedConfigData = mergeWithDefaults(data.config);
        setConfig(savedConfigData);
        setSavedConfig(savedConfigData);
        if (data.presets) setPresets(data.presets);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save configuration");
        return false;
      }
    } catch (err) {
      console.error("Failed to save particle config:", err);
      setError("Failed to save - server unavailable");
      return false;
    }
  }, [config, presets, activePresetId, isAdmin, session?.access_token]);

  // Reset to defaults (admin only)
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    if (!isAdmin || !session?.access_token) {
      setError("You must be logged in as admin to reset configuration");
      return false;
    }

    setError(null);

    try {
      const response = await fetch("/api/particles/config", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const resetConfig = mergeWithDefaults(data.config);
        setConfig(resetConfig);
        setSavedConfig(resetConfig);
        setPresets([]);
        setActivePresetId(null);
        return true;
      } else {
        setError("Failed to reset configuration");
        return false;
      }
    } catch (err) {
      setError("Failed to reset - server unavailable");
      return false;
    }
  }, [isAdmin, session?.access_token]);

  // Reload config from server
  const reloadConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  // Create a new preset from current config (admin only - saved to server)
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
      setActivePresetId(newPreset.id);
      setSavedConfig(config);
      // Auto-save to server
      autoSaveToServer(config, updatedPresets, newPreset.id);
    },
    [config, presets, autoSaveToServer]
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
        setSavedConfig(config);
        // Auto-save to server
        autoSaveToServer(config, updatedPresets, activePresetId);
      } else if (name) {
        // Create new preset
        createPreset(name);
      }
    },
    [activePresetId, config, presets, createPreset, autoSaveToServer]
  );

  // Load a preset (makes it active and pushes to all visitors)
  const loadPreset = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      if (preset) {
        // Merge with defaults to ensure all fields exist
        const fullConfig = mergeWithDefaults(preset.config || {});
        setConfig(fullConfig);
        setSavedConfig(fullConfig);
        setActivePresetId(id);
        // Auto-save to server so all visitors see this preset
        autoSaveToServer(fullConfig, presets, id);
      }
    },
    [presets, autoSaveToServer]
  );

  // Delete a preset (admin only - saved to server)
  const deletePreset = useCallback(
    (id: string) => {
      const updatedPresets = presets.filter((p) => p.id !== id);
      setPresets(updatedPresets);
      // If deleting active preset, clear active
      const newActiveId = activePresetId === id ? null : activePresetId;
      if (activePresetId === id) {
        setActivePresetId(null);
      }
      // Auto-save to server
      autoSaveToServer(config, updatedPresets, newActiveId);
    },
    [presets, activePresetId, config, autoSaveToServer]
  );

  const value = useMemo(
    () => ({
      config,
      isLoading,
      hasChanges,
      isAdmin,
      error,
      updateConfig,
      updateManifold,
      updateGateway,
      updateCamera,
      updateSigil,
      updateMobileGateway,
      updateMobileManifold,
      getMobileConfig,
      updateLandmark,
      addLandmark,
      removeLandmark,
      saveConfig,
      resetToDefaults,
      reloadConfig,
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
      isAdmin,
      error,
      updateConfig,
      updateManifold,
      updateGateway,
      updateCamera,
      updateSigil,
      updateMobileGateway,
      updateMobileManifold,
      getMobileConfig,
      updateLandmark,
      addLandmark,
      removeLandmark,
      saveConfig,
      resetToDefaults,
      reloadConfig,
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
