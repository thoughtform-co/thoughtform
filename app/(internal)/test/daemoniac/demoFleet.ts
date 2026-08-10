// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC LAB — the record sources.
//
// The demo fleet is Vince's OWN practice drawn as binds (personal
// register — invented freely, no confidentiality envelope). The four
// tools adapter reads PROJECT_CASES but ONLY its public-sanctioned
// strings: codename, tab, capability titles, stack. Nothing from
// lib/cases/ and nothing beyond what the landing already prints —
// the envelope boundary of this lab.
// ═══════════════════════════════════════════════════════════════════

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { BindRecord } from "@/lib/daemoniac/types";

/** A source of records the composer can draw. Future adapters (e.g.
 *  MAP_WORKS) implement this same shape. */
export interface RecordSource {
  id: string;
  label: string;
  records: readonly BindRecord[];
}

export const DEMO_FLEET: readonly BindRecord[] = [
  {
    id: "fleet-voidwalker",
    name: "Voidwalker",
    class: "person-led",
    lane: "Judgment",
    skills: ["Taste", "Final Cut"],
    connectors: ["The Room"],
    contexts: ["Twenty Years"],
    autonomy: "decides-alone",
  },
  {
    id: "fleet-wayfinder",
    name: "Wayfinder",
    class: "agent",
    lane: "Deep Reasoning",
    skills: ["Pattern Hunt", "Connection Trace", "Capture Routing"],
    connectors: ["Substrate Vault"],
    contexts: ["Canon", "Groundtruth"],
    autonomy: "wide",
  },
  {
    id: "fleet-surveyor",
    name: "Surveyor",
    class: "agent",
    lane: "Vision Reading",
    skills: ["Distillation", "Facet Survey"],
    connectors: ["Reference Library"],
    contexts: ["Design Rack"],
    autonomy: "bounded",
  },
  {
    id: "fleet-morning-herald",
    name: "Morning Herald",
    class: "agent",
    lane: "Fast Retrieval",
    skills: ["Agenda", "Mail Sweep", "Weather Eye"],
    connectors: ["Calendar", "Mail", "Slack"],
    contexts: ["The Day"],
    autonomy: "bounded",
  },
  {
    id: "fleet-ledger-daemon",
    name: "Ledger Daemon",
    class: "tool",
    lane: "Structured Extraction",
    skills: ["Invoice Match", "Aging Watch"],
    connectors: ["Drive", "Expense Desk"],
    contexts: ["The Books"],
    autonomy: "wide",
  },
  {
    id: "fleet-sentinel",
    name: "Sentinel",
    class: "skill",
    lane: "Governance",
    skills: ["Decision Records", "Best Practices", "Maintenance"],
    connectors: [],
    contexts: ["The Repo"],
    autonomy: "bounded",
  },
  {
    id: "fleet-voice",
    name: "Voice of the House",
    class: "skill",
    lane: "Register",
    skills: ["Flemish Dutch", "Keynote", "Longform"],
    connectors: [],
    contexts: ["The Corpus"],
    autonomy: "bounded",
  },
];

/** The four production tools as binds — sanctioned strings only. */
export function fourTools(): readonly BindRecord[] {
  return PROJECT_CASES.map((c) => ({
    id: `tool-${c.id}`,
    name: c.codename,
    class: "tool" as const,
    lane: c.tab,
    skills: c.capabilities.map((cap) => cap.title),
    connectors: c.stack.slice(0, 4),
    contexts: [],
    autonomy: "bounded" as const,
  }));
}

export const RECORD_SOURCES: readonly RecordSource[] = [
  { id: "fleet", label: "THE FLEET", records: DEMO_FLEET },
  { id: "tools", label: "THE TOOLS", records: fourTools() },
];
