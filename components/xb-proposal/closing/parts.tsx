import type { ArcListGroup } from "@/lib/arcs/types";

/* Shared pieces of the framed closing run (`Frames.tsx`, `WeeksIndex.tsx`). */

export function label(l: string) {
  const [a, b = ""] = l.split(" · ");
  return `${a} · ${b}`;
}
/** A frame cell's title: the lead in full ink, the rest a step down. */
export function Lead({ lead, rest }: { lead: string; rest?: string }) {
  return (
    <h3 className="xf-lead">
      {lead}
      {rest && <span> {rest}</span>}
    </h3>
  );
}

export function PhaseItems({ g, n }: { g: ArcListGroup; n: number }) {
  return (
    <ol className="xf-list">
      {g.items.map((it, i) => (
        <li key={it.id}>
          <span className="xf-list__n">
            {n}.{i + 1}
          </span>
          <span className="xf-list__t">{it.tag}</span>
          <span className="xf-list__d">{it.name}</span>
        </li>
      ))}
    </ol>
  );
}

export function PhaseFoot({ g }: { g: ArcListGroup }) {
  if (!g.foot) return null;
  return (
    <div className="xf-foot">
      <span className="xf-mono xf-gold">{g.foot.label}</span>
      <ul>
        {g.foot.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

