# X-Bionic proposal → PDF

The PDF is shot off the live page itself, so every page is the page's own pixels:
one 1920×1080 still per print page at 2× (`capture.mjs`), bound into a landscape
PDF with each still as a JPEG (`pdf.mjs`). Nothing on the live page changes.

Scroll-driven sections are shot in a designed static state:

- Navigate, encode, build — the page's reduced-motion state: all three steps read, the stack closed.
- Marketing first, then every team — the reduced-motion last frame of the network.
- The Loop story — one page per project, its words beside its own visual, the other panels hidden.
- The four weeks, who takes part — the section seated in the frame (both run ~60px past 1080).

```bash
npx next dev --webpack -p 3026      # a free port, in this worktree
node scripts/xb-print/capture.mjs <stillsDir> http://localhost:3026
node scripts/xb-print/pdf.mjs <stillsDir> <out.pdf>
```

Headed on purpose: the hero is WebGL. The arcs password gate fails open locally
when no `ARCS_PASSWORD` is set; with one set, unlock in the browser first.
