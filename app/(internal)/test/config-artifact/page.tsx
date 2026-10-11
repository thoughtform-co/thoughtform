import type { ComponentType } from "react";
import { type FrameNo } from "@/components/config-artifact/copy";
import { P1Panes } from "@/components/config-artifact/p/P1Panes";
import { P2Frontal } from "@/components/config-artifact/p/P2Frontal";
import { P4Machine } from "@/components/config-artifact/p/P4Machine";
import { P5Holo } from "@/components/config-artifact/p/P5Holo";
import { P3Board } from "@/components/config-artifact/p/P3Board";
import { ArtifactStage } from "@/components/config-artifact/Shell";
import { Ready } from "@/components/xb-proposal/Ready";

import "@/components/xb-proposal/xb.css";
import "@/components/config-artifact/iso/iso.css";
import "@/components/config-artifact/ca.css";

/* The configuration artifact in five permutations. `?p=1..5` picks one,
   `&f=1|2` the section-1 frame (where it plugs in) or the section-2 frame
   (adoption becomes automation). With no `p`, every one runs down the page. */

const PERMS: { n: number; name: string; label: string; C: ComponentType<{ frame: FrameNo }> }[] = [
  { n: 1, name: "exploded panes", label: "The team's sheets, the configuration's panes and Claude Enterprise's tags, standing in one isometric row", C: P1Panes },
  { n: 2, name: "frontal stack", label: "The team, the configuration and Claude Enterprise stacked on one beam", C: P2Frontal },
  { n: 3, name: "motherboard", label: "The configuration as the central chip, wired to the team and to Claude Enterprise", C: P3Board },
  { n: 4, name: "machine", label: "Claude Enterprise as a console, the configuration as a lit cartridge in its slot, the team as a patch panel wired to it", C: P4Machine },
  { n: 5, name: "centrepiece", label: "The brand mark over instrument rings, the team's lanes running in and Claude Enterprise's lanes running out", C: P5Holo },
];

export default async function ConfigArtifactPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; f?: string }>;
}) {
  const { p, f } = await searchParams;
  const frames: FrameNo[] = f === "1" ? [1] : f === "2" ? [2] : [1, 2];
  const list = p ? PERMS.filter((x) => String(x.n) === p) : PERMS;
  return (
    <main className="xb">
      <Ready />
      {list.flatMap(({ n, name, label, C }) =>
        frames.map((fr) => (
          <ArtifactStage key={`${n}-${fr}`} route={`P${n} · ${name} · S${fr}`} frame={fr} label={label}>
            <C frame={fr} />
          </ArtifactStage>
        )),
      )}
    </main>
  );
}
