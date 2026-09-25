import {
  ORBIT_HALF,
  ORBIT_RINGS,
  orbitCirclePath,
  orbitElapsedPath,
  orbitEllipsePath,
  orbitEllipsePoint,
  orbitSpec,
} from "@/lib/musings/orbit";

/**
 * A note's drawn cover — the field behind the owner's portrait, carrying the
 * note's own year (ADR-122 U2). `lib/musings/orbit.ts` resolves the record and
 * the geometry; this file only draws.
 *
 * ⚠ **IT IS A FIELD, NOT AN INSTRUMENT** (owner, 2026-09-25: "less like a
 * compass and more abstract, like the diagrams behind our profile picture in
 * the about section"). Nothing here takes a bearing: there is no graduated
 * rim, no cardinal stub, no spoke, no hand and no beat mark — the row letters
 * the beat two columns to the left. What is drawn is About's six rings, the
 * note's year as a tilted orbit through them, the part of that year already
 * elapsed, the note's own body on its day, the year's other notes as open
 * dots, and About's dust.
 *
 * ⚠ **NO SVG `<text>`, NO DOM LABEL AND NO `transform` ATTRIBUTE.** The cover
 * letters nothing at all now (the row already prints the date, the beat and
 * the length), the tilt rides the arc command's own rotation term, and every
 * mark is drawn at its own coordinates.
 * ⚠ **AND NO FRAME** (owner, same read: "just the diagram") — the drawing
 * sits on the station's own ground; `.mu-note__cover` declares no border and
 * no background, and the capture fails either.
 */
export function MusingOrbit({
  post,
  posts,
}: {
  post: { slug: string; date: string };
  posts: readonly { slug: string; date: string }[];
}) {
  const spec = orbitSpec(post, posts);
  const at = orbitEllipsePoint(spec.path, spec.f);

  return (
    <svg
      className="mu-orbit"
      viewBox={`${-ORBIT_HALF} ${-ORBIT_HALF} ${2 * ORBIT_HALF} ${2 * ORBIT_HALF}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* The field: About's six rings, radius for radius. */}
      {ORBIT_RINGS.map((g) => (
        <path
          key={g.r}
          d={orbitCirclePath(g.r)}
          className={`mu-orbit__${g.ink}`}
          strokeDasharray={g.dash}
        />
      ))}
      {/* About's dust, seeded off the slug. */}
      {spec.drift.map((m, i) => (
        <circle
          key={i}
          cx={m.x}
          cy={m.y}
          r={m.r}
          className="mu-orbit__mote"
          style={{ opacity: m.o }}
        />
      ))}
      {/* The note's year, and the part of it already spent. */}
      <path d={orbitEllipsePath(spec.path)} className="mu-orbit__orbit" />
      {spec.f > 0.004 ? (
        <path d={orbitElapsedPath(spec.path, spec.f)} className="mu-orbit__elapsed" />
      ) : null}
      {/* The year's other notes, on the same orbit. */}
      {spec.others.map((f, i) => {
        const p = orbitEllipsePoint(spec.path, f);
        return <circle key={i} cx={p.x} cy={p.y} r={3.4} className="mu-orbit__mark" />;
      })}
      {/* The note itself: a body with its corona — About's lit pair. */}
      <circle cx={at.x} cy={at.y} r={15} className="mu-orbit__corona" />
      <circle cx={at.x} cy={at.y} r={6} className="mu-orbit__lit" />
    </svg>
  );
}
