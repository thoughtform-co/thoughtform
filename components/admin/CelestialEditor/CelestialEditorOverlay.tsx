"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import type { CelestialConfig, CelestialDesign } from "@/lib/celestial/schema";
import { CelestialEditorModal } from "./CelestialEditorModal";
import "./celestial-editor.css";

/**
 * Floating admin overlay for celestial connectors.
 * Activates when an admin user presses Cmd+Shift+K or visits ?edit=celestial.
 * Adds "Edit" chips over each [data-celestial-slot] element.
 */
export function CelestialEditorOverlay() {
  const { user, session } = useAuth();
  const [active, setActive] = useState(false);
  const [designs, setDesigns] = useState<CelestialDesign[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<CelestialConfig | undefined>();

  const isAdmin = process.env.NODE_ENV === "development" || isAllowedUserEmail(user?.email);
  const token = session?.access_token;

  // Keyboard shortcut: Cmd+Shift+K
  useEffect(() => {
    if (!isAdmin) return;

    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "K") {
        e.preventDefault();
        setActive((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isAdmin]);

  // URL param activation
  useEffect(() => {
    if (!isAdmin) return;
    if (new URLSearchParams(window.location.search).get("edit") === "celestial") {
      setActive(true);
    }
  }, [isAdmin]);

  // Fetch designs when overlay activates
  useEffect(() => {
    if (!active) return;
    fetchDesigns();
  }, [active]);

  const authHeaders = useCallback((): HeadersInit => {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchDesigns = async () => {
    try {
      const res = await fetch("/api/celestial/designs");
      const json = await res.json();
      setDesigns(json.designs ?? []);
    } catch {
      console.error("Failed to fetch celestial designs");
    }
  };

  const handleSave = async (name: string, config: CelestialConfig, id?: string) => {
    const res = await fetch("/api/celestial/designs", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id, name, config }),
    });
    if (res.ok) await fetchDesigns();
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

  const handleSlotClick = (slotId: string) => {
    setActiveSlotId(slotId);
  };

  // Add edit chips over slots when active
  useEffect(() => {
    if (!active) return;

    const slots = document.querySelectorAll<HTMLElement>("[data-celestial-slot]");
    const chips: HTMLElement[] = [];

    slots.forEach((el) => {
      const slotId = el.dataset.celestialSlot;
      if (!slotId) return;

      el.style.position = "relative";

      const chip = document.createElement("button");
      chip.className = "celestial-slot-chip";
      chip.textContent = `Edit · ${slotId}`;
      chip.addEventListener("click", () => handleSlotClick(slotId));
      el.appendChild(chip);
      chips.push(chip);
    });

    return () => {
      chips.forEach((c) => c.remove());
    };
  }, [active]);

  if (!isAdmin || !active) return null;

  return (
    <CelestialEditorModal
      initialConfig={editConfig}
      designs={designs}
      activeSlotId={activeSlotId}
      onSave={handleSave}
      onDelete={handleDelete}
      onApplyToSlot={handleApplyToSlot}
      onClose={() => setActive(false)}
      onLoadDesign={(d) => setEditConfig(d.config)}
    />
  );
}
