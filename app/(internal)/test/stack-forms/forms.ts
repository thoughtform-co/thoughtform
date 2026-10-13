/* The directions, in the order the page shows them. Each is a different
   CONSTRUCTION of the same three plates (`model/`), not a re-skin: what the
   plates are made of is the argument.

   Round one drew five (S1 to S5). Round two iterates on the three the owner
   took further (2026-10-13: S1 "a bit more wireframe like the unsiloed
   example"; S4 "a bit too much like a Christmas decoration … more
   minimalistic"; S5 "the middle panel looks a bit too much like Lego"; and
   of all of them, "it would be amazing if it would fit the aesthetic of our
   Arc 3D thing on our homepage"). An iteration sits right after the
   direction it comes from and carries its code with a letter.

   Round three, on his read of round two (2026-10-13): S4·B "but use the
   colors like S4 Swarm … but with the animations" (S4·D); S5·B "needs not
   the 'evals' as a material; more minimalistic" (S5·C). */

import type { ComponentType } from "react";

import type { FormProps } from "./model";
import { Phosphor } from "./phosphor/Phosphor";
import { PhosphorSpare } from "./phosphor/PhosphorSpare";
import { PhosphorWritten } from "./phosphor/PhosphorWritten";
import { Print } from "./print/Print";
import { Readout } from "./readout/Readout";
import { Swarm } from "./swarm/Swarm";
import { SwarmBands } from "./swarm/SwarmBands";
import { SwarmQuiet } from "./swarm/SwarmQuiet";
import { SwarmTones } from "./swarm/SwarmTones";
import { Wire } from "./wire/Wire";
import { WireBare } from "./wire/WireBare";

export type FormId =
  | "wire"
  | "wire-b"
  | "print"
  | "readout"
  | "swarm"
  | "swarm-b"
  | "swarm-c"
  | "swarm-d"
  | "phosphor"
  | "phosphor-b"
  | "phosphor-c";

export interface Form {
  id: FormId;
  code: string;
  name: string;
  /** The direction this one iterates on, if it is an iteration. */
  of?: FormId;
  /** What the plates are made of, in a few words. */
  made: string;
  /** One sentence: what this direction argues. */
  note: string;
  /** What it is drawn after. */
  after: string;
  C: ComponentType<FormProps>;
}

export const FORMS: readonly Form[] = [
  {
    id: "wire",
    code: "S1",
    name: "Wire",
    made: "Hairline and wash",
    note: "The stack as a drafting sheet: flat planes, a cross on every corner, one plate washed in.",
    after: "Unsiloed",
    C: Wire,
  },
  {
    id: "wire-b",
    code: "S1·B",
    name: "Wire, bare",
    of: "wire",
    made: "Dashes, crosses, one wash",
    note: "Nearer the reference: nothing drawn on the plates, each lettered on its own edge, the layer the one washed in.",
    after: "Unsiloed, the homepage's nested frames",
    C: WireBare,
  },
  {
    id: "print",
    code: "S2",
    name: "Print",
    made: "Flat opaque planes",
    note: "Solid slabs with no outlines, their content printed on them large.",
    after: "Marathon",
    C: Print,
  },
  {
    id: "readout",
    code: "S3",
    name: "Readout",
    made: "Modules in a frame",
    note: "Not an object but a display of one: each plate a ring of modules, state by tone.",
    after: "Evangelion, Cyberpunk 2077",
    C: Readout,
  },
  {
    id: "swarm",
    code: "S4",
    name: "Swarm",
    made: "Dots only",
    note: "No lines at all: density and dot size carry the three plates.",
    after: "Dot matrices",
    C: Swarm,
  },
  {
    id: "swarm-b",
    code: "S4·B",
    name: "Swarm, banded",
    of: "swarm",
    made: "Rows of gold dots",
    note: "The homepage sphere's own material: one hue, dots in bands, an axis through the three.",
    after: "The Arc sphere",
    C: SwarmBands,
  },
  {
    id: "swarm-c",
    code: "S4·C",
    name: "Swarm, quiet",
    of: "swarm",
    made: "One even lattice",
    note: "The least it can be: one grid of equal dots, the layer the only thing lit.",
    after: "The Arc sphere",
    C: SwarmQuiet,
  },
  {
    id: "swarm-d",
    code: "S4·D",
    name: "Swarm, banded, in tones",
    of: "swarm",
    made: "Rows of dots, three tones, moving",
    note: "The banded order with S4's own colours and motion: green, gold and bone, and dots that travel.",
    after: "The Arc sphere, dot matrices",
    C: SwarmTones,
  },
  {
    id: "phosphor",
    code: "S5",
    name: "Phosphor",
    made: "Characters",
    note: "The stack set in type: a density ramp gives each plate its faces.",
    after: "Retro terminals",
    C: Phosphor,
  },
  {
    id: "phosphor-b",
    code: "S5·B",
    name: "Phosphor, written",
    of: "phosphor",
    made: "Characters, no blocks",
    note: "The layer is what was written down, so it is set in words, not in bricks.",
    after: "Retro terminals",
    C: PhosphorWritten,
  },
  {
    id: "phosphor-c",
    code: "S5·C",
    name: "Phosphor, spare",
    of: "phosphor",
    made: "Few characters",
    note: "The layer is no longer filled with its own words: each plate is set with the least type that still reads.",
    after: "Retro terminals",
    C: PhosphorSpare,
  },
];

export const isFormId = (v: string | undefined): v is FormId => FORMS.some((f) => f.id === v);
