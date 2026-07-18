/** Four-corner bracket cursor — the shared "locked target" frame used
 *  by the glyph-index active row (R1) and the astrogation reticle (R5).
 *  Legs are offset by their own stroke width so the vertex reads as a
 *  clean corner, not a plus (shape law). */
export function CornerBracket({ className }: { className?: string }) {
  return (
    <span className={`sml-bracket${className ? ` ${className}` : ""}`} aria-hidden="true">
      <i className="sml-bracket__c sml-bracket__c--tl" />
      <i className="sml-bracket__c sml-bracket__c--tr" />
      <i className="sml-bracket__c sml-bracket__c--bl" />
      <i className="sml-bracket__c sml-bracket__c--br" />
    </span>
  );
}
