import type { ReactNode } from "react";

/** One screen: the instrument rails at both edges, the column between them. */
export function Stage({
  route,
  children,
  id,
}: {
  route: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="xb-stage" id={id} data-xb-stage={route}>
      <span className="xb-corner" aria-hidden />
      <span className="xb-rail xb-rail--l" aria-hidden />
      <span className="xb-rail xb-rail--r" aria-hidden />
      <span className="xb-route" aria-hidden>
        {route}
      </span>
      <div className="xb-col" data-xb-col>
        {children}
      </div>
    </section>
  );
}
