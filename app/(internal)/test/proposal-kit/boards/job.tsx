import { ArcJob } from "@/components/arcs/ArcJob";
import { X_BIONIC_JOBS } from "@/lib/arcs/content/shared/jobs";

import { JobCard, type JobVariant } from "../job/JobCard";
import type { KitSection } from "../types";

const direction = (variant: JobVariant) =>
  function Direction({ job }: { job: number }) {
    return <JobCard section={X_BIONIC_JOBS[job]} variant={variant} />;
  };

/** Board J · the job card. Control first; then round 02's three quieter left
    panels (L1 to L3: the header bar, the figure and the result band are
    production's); then round 01's J1 to J3. `?job=1..4` picks the job: the
    four figures differ in aspect, so each is worth a look. */
export const JOB: readonly KitSection[] = [
  {
    id: "job-control",
    board: "job",
    code: "J0",
    name: "Production",
    note: "The job card as it ships.",
    control: true,
    C: function Control({ job }: { job: number }) {
      return <ArcJob section={X_BIONIC_JOBS[job]} index={job} motion="reveal" />;
    },
  },
  {
    id: "job-l1",
    board: "job",
    code: "L1",
    name: "Type only",
    note: "The left panel with no frames and no lines: a key, its words, air.",
    C: direction("l1"),
  },
  {
    id: "job-l2",
    board: "job",
    code: "L2",
    name: "Ruled rows",
    note: "The left panel as four cells sharing edges, the key in a gutter.",
    C: direction("l2"),
  },
  {
    id: "job-l3",
    board: "job",
    code: "L3",
    name: "Half the ink",
    note: "Production's left panel: one hairline, plain tabs, plain tool names.",
    C: direction("l3"),
  },
  {
    id: "job-j1",
    board: "job",
    code: "J1",
    name: "One ladder",
    note: "The tools are a fourth box in the steps' own frame.",
    C: direction("j1"),
  },
  {
    id: "job-j2",
    board: "job",
    code: "J2",
    name: "Split follows the figure",
    note: "The frame hugs the evidence; the result cards meet on the rule.",
    C: direction("j2"),
  },
  {
    id: "job-j3",
    board: "job",
    code: "J3",
    name: "Result strip",
    note: "The result as one ruled strip across the foot.",
    C: direction("j3"),
  },
];
