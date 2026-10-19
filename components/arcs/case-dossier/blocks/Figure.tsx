import { Frame } from "../Frame";
import type { Framed } from "../types";
import { Exchange } from "./Exchange";
import { Field } from "./Field";
import { FilmPlayer } from "./FilmPlayer";
import { Flow } from "./Flow";
import { Ledger } from "./Ledger";
import { Pairs } from "./Pairs";
import { Plates } from "./Plates";
import { Anatomy } from "./Anatomy";
import { Chain } from "./Chain";
import { Cloud } from "./Cloud";
import { Screen } from "./Screen";
import { Sheet } from "./Sheet";
import { Sprawl } from "./Sprawl";
import { Track } from "./Track";

/** One framed figure, by kind. Server; only the film's switch is client. */
export function FigureView({
  n,
  client,
  framed,
  still,
}: {
  n: number;
  client: string;
  framed: Framed;
  still: boolean;
}) {
  const f = framed.figure;
  return (
    <Frame n={n} client={client} framed={framed}>
      {f.kind === "film" ? (
        <div className="csd-film">
          <FilmPlayer
            src={f.src}
            poster={f.poster}
            ratio={f.ratio}
            alt={f.alt}
            sound={f.sound ?? false}
            still={still}
          />
          <ol className="csd-film__facts">
            {f.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </div>
      ) : f.kind === "plates" ? (
        <Plates figure={f} />
      ) : f.kind === "pairs" ? (
        <Pairs figure={f} />
      ) : f.kind === "track" ? (
        <Track figure={f} />
      ) : f.kind === "exchange" ? (
        <Exchange figure={f} />
      ) : f.kind === "ledger" ? (
        <Ledger figure={f} />
      ) : f.kind === "field" ? (
        <Field figure={f} />
      ) : f.kind === "screen" ? (
        <Screen figure={f} />
      ) : f.kind === "sprawl" ? (
        <Sprawl figure={f} />
      ) : f.kind === "cloud" ? (
        <Cloud figure={f} still={still} />
      ) : f.kind === "sheet" ? (
        <Sheet figure={f} />
      ) : f.kind === "anatomy" ? (
        <Anatomy figure={f} />
      ) : f.kind === "chain" ? (
        <Chain figure={f} />
      ) : (
        <Flow figure={f} />
      )}
    </Frame>
  );
}
