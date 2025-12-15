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
  type ParticleSystemConfig,
  type ManifoldConfig,
  type LandmarkConfig,
} from "@/lib/particle-config";

// localStorage key for fallback storage
const LOCAL_STORAGE_KEY = "thoughtform-particle-config";

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
      updateLandmark,
      addLandmark,
      removeLandmark,
      saveConfig,
      resetToDefaults,
      reloadConfig,
      setPreviewMode,
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
      updateLandmark,
      addLandmark,
      removeLandmark,
      saveConfig,
      resetToDefaults,
      reloadConfig,
      setPreviewMode,
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

