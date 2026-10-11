import type { CSSProperties, ReactNode } from "react";

/**
 * A section of the rebuilt proposition (the X-Bionic core lab, 2026-10-11).
 * One head, one body. The head is two columns on a laptop (the title left,
 * the lede right, both on one baseline) so the body keeps the screen; the
 * route tag is lab chrome and names the variation.
 */
export function XcSection({
  id,
  route,
  eyebrow,
  title,
  dim,
  lede,
  children,
  className = "",
  fit,
}: {
  fit?: { W: number; H: number; reserve?: string };
  id: string;
  route: string;
  eyebrow: string;
  title: string;
  dim?: string;
  lede?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`xc-sec ${className}`} data-route={route}>
      <div className="arc-band">
        <div
          className="xc-wrap"
          style={
            fit
              ? ({
                  "--w": fit.W,
                  "--h": fit.H,
                  ...(fit.reserve ? { "--xc-reserve": fit.reserve } : {}),
                } as CSSProperties)
              : undefined
          }
        >
          <XcHead eyebrow={eyebrow} title={title} dim={dim} lede={lede} route={route} />
          <div className="xc-body">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function XcHead({
  eyebrow,
  title,
  dim,
  lede,
  route,
}: {
  eyebrow: string;
  title: string;
  dim?: string;
  lede?: string;
  route?: string;
}) {
  return (
    <header className="xc-head">
      <div className="xc-head__l">
        <p className="xc-eyebrow">
          <span className="xc-eyebrow__mark" aria-hidden="true" />
          {eyebrow}
          {route ? <span className="xc-route">{route}</span> : null}
        </p>
        <h2 className="xc-title">
          {title}
          {dim ? <span className="xc-title__dim"> {dim}</span> : null}
        </h2>
      </div>
      {lede ? <p className="xc-lede">{lede}</p> : null}
    </header>
  );
}
