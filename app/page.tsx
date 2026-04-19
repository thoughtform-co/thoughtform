import type { Metadata } from "next";
import { getV7Content } from "./v7-parse";
import { V7Landing } from "./V7Landing";

export const metadata: Metadata = {
  title: "Thoughtform — Navigate Intelligence",
  description:
    "Thoughtform pioneers intuitive human-AI collaboration. We teach teams how to navigate AI for creative and strategic work.",
};

export default function Home() {
  const { bodyHtml, bodyClass, scopedCss } = getV7Content();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <V7Landing bodyHtml={bodyHtml} bodyClass={bodyClass} />
    </>
  );
}
