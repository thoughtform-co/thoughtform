/**
 * A section's head (ADR-150): Evangelion's numbered module head — an
 * ordinal TAB (a closed box, the page's one gold-ink chrome), the kicker in
 * mono, the title in the display face. ⚠ NO RULE UNDER IT: the owner's
 * verdict on the sheet's open dividers ("what are these dividers?") is
 * that a line which divides nothing is noise; the head is separated from
 * the body by air.
 */
export function SessionsHead({
  ord,
  kicker,
  title,
  sub,
  id,
}: {
  ord: string;
  kicker: string;
  title: string;
  sub?: string;
  id: string;
}) {
  return (
    <header className="hs-head hs-reveal">
      <span className="hs-head__ord" aria-hidden="true">
        {ord}
      </span>
      <p className="hs-head__kicker">{kicker}</p>
      <h2 className="hs-head__title" id={id}>
        {title}
      </h2>
      {sub ? <p className="hs-head__sub">{sub}</p> : null}
    </header>
  );
}
