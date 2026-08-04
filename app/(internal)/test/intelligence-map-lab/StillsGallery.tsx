import { stillCaption } from "./variants";

/**
 * StillsGallery — a dead round as a dark contact sheet.
 *
 * Rounds 1 and 2 and the round-3 polar port are GONE as code; what survives is
 * the shoot that killed each one. That is worth keeping reachable: the rejection
 * is the argument, and a still is honest about being a still — an interactive
 * mock of a rejected round would invite re-litigating it.
 *
 * Plain `<img>`, not `next/image`: these come off a lab-only route handler, the
 * optimizer would have to be told they exist, and a contact sheet wants the
 * PNG at its NATURAL width so the type in it is judged at the size it shipped.
 */
export function StillsGallery({
  round,
  files,
  verdict,
}: {
  round: string;
  files: readonly string[];
  verdict: string;
}) {
  return (
    <div className="iml-sheet">
      <div className="iml-sheet__head">
        <span className="iml-sheet__ord">{round.toUpperCase()}</span>
        <span className="iml-sheet__verdict">{verdict}</span>
        <span className="iml-sheet__count">
          {String(files.length).padStart(2, "0")} STILLS · NOT INTERACTIVE
        </span>
      </div>

      <div className="iml-sheet__body">
        {files.map((file) => (
          <figure className="iml-still" key={file}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="iml-still__img"
              src={`/test/intelligence-map-lab/archive/stills/${round}/${file}`}
              alt={stillCaption(file)}
              loading="lazy"
            />
            <figcaption className="iml-still__cap">{stillCaption(file)}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
