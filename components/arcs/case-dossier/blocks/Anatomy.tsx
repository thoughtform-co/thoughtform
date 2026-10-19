import type { Figure } from "../types";

type AnatomyFigure = Extract<Figure, { kind: "anatomy" }>;

const SRC: Record<AnatomyFigure["parts"][number]["src"], string> = {
  list: "From a list",
  text: "Typed once",
  fixed: "Set by the system",
};

/**
 * Anatomy: one name taken apart. The whole name runs across the top in mono;
 * under it every part sits on its own tile with the field it comes from,
 * toned by where its value comes from (a list, typed once, set by the
 * system). Under the tiles, the rules that build it, and the one way it
 * used to break.
 */
export function Anatomy({ figure }: { figure: AnatomyFigure }) {
  const used = [...new Set(figure.parts.map((p) => p.src))];
  return (
    <div className="csd-anat">
      <p className="csd-anat__whole">
        {figure.parts.map((p, i) => (
          <span key={i} data-src={p.src}>
            {p.v}
            {i < figure.parts.length - 1 ? <i>_</i> : null}
          </span>
        ))}
      </p>
      <ol className="csd-anat__parts">
        {figure.parts.map((p, i) => (
          <li key={i} data-src={p.src}>
            <span className="csd-anat__n">{String(i + 1).padStart(2, "0")}</span>
            <span className="csd-anat__v">{p.v}</span>
            <span className="csd-anat__k">{p.k}</span>
          </li>
        ))}
      </ol>
      <div className="csd-anat__foot">
        <ul className="csd-anat__key">
          {used.map((s) => (
            <li key={s} data-src={s}>
              <i aria-hidden="true" />
              {SRC[s]}
            </li>
          ))}
        </ul>
        <ul className="csd-anat__rules">
          {figure.rules.map((r) => (
            <li key={r.label}>
              <b>{r.label}</b>
              <span>{r.note}</span>
            </li>
          ))}
          {figure.fail ? (
            <li data-fail="">
              <b>{figure.fail.v}</b>
              <span>{figure.fail.note}</span>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
