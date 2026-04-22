import { create } from "zustand";
import type { CelestialConfig } from "@/lib/celestial/schema";

interface CelestialDraftsState {
  drafts: Record<string, CelestialConfig>;
  setDraft: (slotId: string, config: CelestialConfig) => void;
  clearDraft: (slotId: string) => void;
  clearAll: () => void;
}

export const useCelestialDrafts = create<CelestialDraftsState>((set) => ({
  drafts: {},
  setDraft: (slotId, config) => set((s) => ({ drafts: { ...s.drafts, [slotId]: config } })),
  clearDraft: (slotId) =>
    set((s) => {
      const next = { ...s.drafts };
      delete next[slotId];
      return { drafts: next };
    }),
  clearAll: () => set({ drafts: {} }),
}));
