/** The board's own head: a kicker, a title, one line. Lab chrome, not a recipe. */
export function BoardHead({
  kicker,
  title,
  line,
}: {
  kicker: string;
  title: string;
  line: string;
}) {
  return (
    <header className="ins-board__head">
      <span className="ins-board__kicker">{kicker}</span>
      <h2 className="ins-board__title">{title}</h2>
      <p className="ins-board__line">{line}</p>
    </header>
  );
}
