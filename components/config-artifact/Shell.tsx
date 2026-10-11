import type { ReactNode } from "react";
import { Stage } from "@/components/xb-proposal/Frame";
import { TEXT, type FrameNo } from "./copy";

export const VB_W = 610;
export const VB_H = 570;

/** Words left, the artifact right: the Unsiloed hero's split. */
export function ArtifactStage({
  route,
  frame,
  label,
  children,
}: {
  route: string;
  frame: FrameNo;
  label: string;
  children: ReactNode;
}) {
  const t = TEXT[frame];
  return (
    <Stage route={route}>
      <div className="ca">
        <div className="ca__text">
          <div className="xb-eyebrow">{t.eyebrow}</div>
          <h2 className="xb-title">
            {t.title[0]}
            <br />
            <span>{t.title[1]}</span>
          </h2>
          <p className="xb-body ca__body">{t.body}</p>
          <ol className="ca__keys">
            {t.keys.map((k) => (
              <li key={k.n} data-gold={k.gold || undefined}>
                <span className="ca__tag">{k.n}</span>
                {k.label}
              </li>
            ))}
          </ol>
        </div>
        <div className="ca__fig">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
            {children}
          </svg>
        </div>
      </div>
    </Stage>
  );
}
