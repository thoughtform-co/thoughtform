"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import type { CelestialConfig, CelestialDesign } from "@/lib/celestial/schema";
import { CelestialEditorModal } from "./CelestialEditorModal";
import { useCelestialDrafts } from "./useCelestialDrafts";
import "./celestial-editor.css";

/**
 * Admin overlay for celestial connectors.
 * Always active for admins — hover any connector to see a subtle Edit chip.
 * Clicking the chip opens the editor panel pre-targeted at that slot.
 */
export function CelestialEditorOverlay() {
  const { user, session } = useAuth();
  const [designs, setDesigns] = useState<CelestialDesign[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<CelestialConfig | undefined>();
  const chipsRef = useRef<HTMLElement[]>([]);

  const isAdmin = process.env.NODE_ENV === "development" || isAllowedUserEmail(user?.email);
  const token = session?.access_token;
  const clearDraft = useCelestialDrafts((s) => s.clearDraft);

  const authHeaders = useCallback((): HeadersInit => {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchDesigns = useCallback(async () => {
    try {
      const res = await fetch("/api/celestial/designs");
      const json = await res.json();
      setDesigns(json.designs ?? []);
    } catch {
      console.error("Failed to fetch celestial designs");
    }
  }, []);

  const handleSave = async (name: string, config: CelestialConfig, id?: string) => {
    const res = await fetch("/api/celestial/designs", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id, name, config }),
    });
    if (res.ok) await fetchDesigns();
    return res;
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/celestial/designs?id=${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) await fetchDesigns();
  };

  const handleApplyToSlot = async (slotId: string, designId: string) => {
    await fetch("/api/celestial/slots", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ slot_id: slotId, design_id: designId }),
    });
  };

  const handleClose = () => {
    if (activeSlotId) clearDraft(activeSlotId);
    setActiveSlotId(null);
    setEditConfig(undefined);
  };

  // Fetch designs on first admin mount
  useEffect(() => {
    if (!isAdmin) return;
    fetchDesigns();
  }, [isAdmin, fetchDesigns]);

  // Inject hover-revealed edit chips over every slot element
  useEffect(() => {
    if (!isAdmin) return;

    const injectChips = () => {
      chipsRef.current.forEach((c) => c.remove());
      chipsRef.current = [];

      const slots = document.querySelectorAll<HTMLElement>("[data-celestial-slot]");
      slots.forEach((el) => {
        const slotId = el.dataset.celestialSlot;
        if (!slotId) return;

        if (getComputedStyle(el).position === "static") {
          el.style.position = "relative";
        }

        const chip = document.createElement("button");
        chip.className = "celestial-slot-chip";
        chip.textContent = "Edit";
        chip.addEventListener("click", () => {
          fetchDesigns();
          setActiveSlotId(slotId);
        });
        el.appendChild(chip);
        chipsRef.current.push(chip);
      });
    };

    // Connectors are portal-mounted, so they may appear after initial render.
    // A short delay + MutationObserver cover both cases.
    const timer = setTimeout(injectChips, 600);

    const observer = new MutationObserver(() => {
      const slotsOnPage = document.querySelectorAll("[data-celestial-slot]").length;
      if (slotsOnPage !== chipsRef.current.length) {
        injectChips();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      chipsRef.current.forEach((c) => c.remove());
      chipsRef.current = [];
    };
  }, [isAdmin, fetchDesigns]);

  if (!isAdmin) return null;
  if (!activeSlotId) return null;

  return (
    <CelestialEditorModal
      initialConfig={editConfig}
      designs={designs}
      activeSlotId={activeSlotId}
      onSave={handleSave}
      onDelete={handleDelete}
      onApplyToSlot={handleApplyToSlot}
      onClose={handleClose}
      onLoadDesign={(d) => setEditConfig(d.config)}
    />
  );
}
