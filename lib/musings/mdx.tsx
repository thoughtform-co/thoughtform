import "server-only";

import { compileMDX } from "next-mdx-remote/rsc";
import { createElement } from "react";
import type { ReactNode } from "react";

import { SheetFigureFrame } from "@/components/sheet/SheetParts";

import type { MusingPost } from "./types";

/**
 * lib/musings/mdx — a post's body, compiled (ADR-114).
 *
 * The component map puts every element on the sheet's own prose classes,
 * and exposes ONE authored element, `<Figure>`, which renders the framed
 * figure (the FIG bar, the duotone, the mono caption) so a post never
 * drops a raw image on the page.
 */

function cls(tag: string, className: string) {
  const Tagged = ({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) =>
    createElement(tag, { className, ...rest }, children);
  Tagged.displayName = `SheetProse(${tag})`;
  return Tagged;
}

function Figure({
  src,
  alt,
  width,
  height,
  caption,
  n = 1,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  n?: number;
}) {
  return (
    <SheetFigureFrame
      figure={{ kind: "image", src, alt, width, height, caption, treatment: "duotone" }}
      n={n}
    />
  );
}

const COMPONENTS = {
  h1: cls("h2", "sh-prose__h2"),
  h2: cls("h2", "sh-prose__h2"),
  h3: cls("h3", "sh-prose__h3"),
  p: cls("p", "sh-prose__p"),
  ul: cls("ul", "sh-prose__ul"),
  ol: cls("ol", "sh-prose__ul"),
  li: cls("li", "sh-prose__li"),
  blockquote: cls("blockquote", "sh-prose__blockquote"),
  a: cls("a", "sh-prose__a"),
  em: cls("em", "sh-prose__em"),
  strong: cls("strong", "sh-prose__em"),
  Figure,
};

export async function renderPostBody(post: MusingPost): Promise<ReactNode> {
  const { content } = await compileMDX({
    source: post.body,
    components: COMPONENTS,
    options: { parseFrontmatter: false },
  });
  return content;
}
