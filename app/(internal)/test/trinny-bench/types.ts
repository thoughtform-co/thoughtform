/** The runner's shapes, mirrored from `Arcs_Trinny London/bench/job.py`. */

export interface Check {
  id: string;
  block: string;
  severity: "gate" | "critical" | "minor" | "advisory" | string;
  set_level: boolean;
  check: string;
  fails_when: string;
  caption: string;
  computed: boolean;
}

export interface Swatch {
  L: number;
  a: number;
  b: number;
  C: number;
  h: number;
  hex: string;
  share?: number;
  pixels?: number;
  name?: string;
}

export interface Subject {
  key: string;
  noun: string;
  identity_path: string;
  mode: "single" | "set" | string;
  band: Swatch | null;
  colours: Swatch[];
}

export interface BenchConfig {
  engagement: { name: string; title: string; callsign: string; started: string };
  rubric_version: string;
  gating: boolean;
  checks: Check[];
  subjects: Subject[];
  types: Array<{
    key: string;
    name: string;
    question: string;
    channel: string;
    ar: string;
    setting_blind: boolean;
  }>;
  settings: string[];
  lanes: Record<string, string>;
  default_lane: string;
  graders: string[];
  runs: number;
  bands: {
    status: string | null;
    measured_at: string | null;
    lines: Record<string, number> | null;
    source: string | null;
  };
  session_dir: string;
  jobs_dir: string;
  armada_version: string;
}

export interface Compare {
  state: "within" | "off" | "other_sku" | "not_applied" | string;
  delta_e00: number | null;
  hue_distance: number | null;
  dL: number | null;
  dC: number | null;
  nearest_subject: string | null;
  line: string;
  matches?: Array<{
    name: string;
    ref: Swatch;
    candidate: Swatch;
    delta_e00: number;
    within: boolean;
  }>;
}

export interface Measurement {
  subject: string;
  mode: string;
  box: number[] | null;
  located: { box: number[] | null; visible: boolean | null; note: string; error?: string } | null;
  stats:
    | (Partial<Swatch> & {
        suspect?: string;
        method?: string;
        pixels?: number;
        clusters?: Swatch[];
        /** The inner 60 % of the product box the colour was read from. */
        sampled_box?: number[];
        dominant?: Swatch;
        refined_to_band?: boolean;
      })
    | null;
  band: Swatch | null;
  colours: Swatch[] | null;
  compare: Compare;
  state: string;
  sentence: string;
  lines: Record<string, number>;
}

export interface FailRow {
  id: string;
  severity: string;
  check: string;
}

export interface RunRecord {
  file?: string;
  verdict: string;
  checks: Record<string, boolean>;
  failed: FailRow[];
  failed_advisory: FailRow[];
  unanswered: string[];
  grader?: string;
  reads_as_grader?: string;
  worst_issue?: string;
  notes?: string;
  error?: string;
  computed?: {
    ids: string[];
    answers: Record<string, boolean>;
    grader_said: Record<string, boolean | null>;
    state: string;
  };
}

export interface FinalRecord extends RunRecord {
  runs?: number;
  run_verdicts?: string[];
  split_answers?: Record<string, string>;
  reads_as_stranger?: string;
  stranger_counts?: string;
  references?: string[];
  note?: string;
}

export interface Job {
  id: string;
  status: "queued" | "drawing" | "measuring" | "grading" | "done" | "error" | string;
  session: string;
  wave: string;
  created: string;
  updated: string | null;
  subject: string | null;
  type: string | null;
  origin: "generate" | "upload" | string | null;
  file: string | null;
  identity: string | null;
  lane: string | null;
  setting: string;
  offline: boolean;
  seconds: Record<string, number>;
  stranger: {
    reads_as?: string;
    purpose?: string;
    part_counts?: string;
    error?: string;
    offline?: boolean;
  } | null;
  measurement: Measurement | null;
  runs: RunRecord[];
  final: FinalRecord | null;
  results_path: string | null;
  error: string | null;
}

export interface HistoryRow {
  id: string;
  status: string;
  origin: string;
  subject: string;
  type: string;
  file: string | null;
  identity: string | null;
  verdict: string | null;
  run_verdicts: string[] | null;
  state: string | null;
  delta_e00: number | null;
  updated: string;
  error: string | null;
}

export interface RegressionNegative {
  file: string;
  recipe: string;
  derived_from: string;
  must_fail: string[];
  must_report: string[];
  hits: Record<string, number>;
  all_hits?: Record<string, number>;
  held: boolean;
  verdicts: string[];
  state: string | null;
  delta_e00: number | null;
}

export interface RegressionPositive {
  file: string;
  verdicts: string[];
  pass_fraction: number;
  flipped: string[];
  state: string | null;
  delta_e00?: number | null;
  failed?: string[];
}

export interface Regression {
  regression: {
    rubric_version: string;
    runs: number;
    graded_at: string;
    offline?: boolean;
    /** The negatives' folder on Drive; the img route serves under it. */
    folder?: string;
    grader?: string;
    seconds?: number;
    negatives: RegressionNegative[];
    positives: RegressionPositive[];
    summary: { negatives: number; held: number; positives: number; positives_clean: number };
  } | null;
  path?: string;
  history?: string[];
  note?: string;
}

/** An image staged in Upload mode: in memory until Run posts it. */
export interface Pending {
  file: File;
  url: string;
  name: string;
  /** The product the colour says it is nearest (`/suggest`), if any. */
  suggested: string | null;
  dE: number | null;
  /** Loaded from a regression case: its subject is read off its name. */
  fromCase: boolean;
  submitted: boolean;
}
