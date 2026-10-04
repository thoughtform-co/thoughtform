/**
 * brandmarkPaths — the Thoughtform brandmark as vector data, the one record.
 *
 * The paths of `public/logos/Thoughtform_Brandmark.svg` (viewBox 430.99 × 436),
 * read by `ThoughtformSigil` (particles sampled from the paths) and by the
 * workshop opener's static drawing (`equilibriumGeom.ts`, the mark inside the
 * gold gate, ADR-143 U10), which needs it as polylines it can project.
 *
 * ⚠ PURE AND THREE-FREE: the opener's geometry renders on the server.
 */

export const BRANDMARK_VIEWBOX = { w: 430.99, h: 436 } as const;

export const BRANDMARK_PATHS: readonly string[] = [
  // Outer arc top-right
  "M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z",
  // Main circular ring
  "M383.13,314.65c-8.61,22.23-21.59,41.97-38.85,59.38-16.91,16.61-35.23,29.06-55,37.36-19.78,8.3-40.21,12.45-61.29,12.45-11.68,0-23.35-1.22-34.92-3.7-2.47-.46-4.93-1.01-7.4-1.67-2.42-.61-4.88-1.27-7.3-2.02-7.4-2.18-14.74-4.91-22.14-8.1-1.21-.51-2.47-1.06-3.67-1.62-1.16-.51-2.31-1.06-3.42-1.62-2.37-1.11-4.73-2.28-7.05-3.49-20.78-10.83-39.75-24.86-56.91-42.07-19.98-19.69-35.63-42.88-46.9-69.56-5.38-12.61-9.46-25.36-12.28-38.22-.6-2.53-1.11-5.06-1.56-7.59s-.85-5.06-1.21-7.59c-.81-5.87-1.41-11.85-1.71-17.77-.1-2.53-.2-5.06-.2-7.59-.05-.96-.05-1.92-.05-2.89,0-1.57,0-3.14.1-4.71.45-21.06,4.48-41.21,11.98-60.45,8.1-20.66,20.53-39.49,37.44-56.45,16.86-17.01,35.48-29.57,55.86-37.67,20.33-8.1,41.62-12.2,63.91-12.2,5.99,0,11.93.25,17.86.81l2.72-14.68c-26.82,0-53.19,5.32-79,15.95-25.92,10.63-49.06,26.12-69.39,46.63-20.73,20.81-36.38,43.99-46.95,69.51-6.59,15.85-11.12,32.05-13.59,48.55-.35,2.53-.7,5.06-.96,7.59-.3,2.53-.5,5.06-.7,7.59-.35,5.01-.55,10.02-.55,15.04,0,.91,0,1.82.05,2.73,0,2.53.1,5.06.25,7.59.1,2.53.25,5.06.5,7.59,1.76,19.9,6.49,39.24,14.14,57.97,9.96,24.3,24.56,46.12,43.78,65.41,19.93,19.74,42.57,34.78,67.93,45.21,3.72,1.52,7.5,2.99,11.27,4.25,2.42.86,4.83,1.67,7.25,2.38,2.42.76,4.88,1.47,7.3,2.13,7.5,2.03,15.1,3.59,22.74,4.71,2.52.35,5.03.71,7.55.96,2.52.3,5.03.51,7.55.66,4.88.41,9.76.56,14.64.56,26.87,0,52.84-5.11,78-15.34,25.16-10.23,47.71-25.41,67.68-45.51,20.33-20.81,35.78-44.2,46.35-70.07,7.1-17.42,11.78-35.18,14.09-53.31h-15.1c-.71,21.82-4.98,42.78-12.83,62.88h-.01Z",
  // Horizontal line left
  "M29.12,218.81l132.09-.05v.05H29.12h0Z",
  // Small connector
  "M163.32,250.35l12.58.05h-12.58v-.05Z",
  // Diagonal vector bottom
  "M179.17,408.81l30.34-158.46-29.79,158.61s-.35-.1-.55-.15h0Z",
  // Main diagonal vector with horizontal bars
  "M430.98,218.81l-5.23,17.77h-184.93l-10.32.05-2.47,13.72h-18.52l-30.34,158.46c-7.2-2.23-14.44-4.96-21.59-8.1l24.05-132.9h-8.86l3.12-17.42h-20.73l2.57-13.77H30.87c-.86-5.87-1.46-11.8-1.76-17.77h132.09l10.32-.05,2.47-13.72h18.52l29.54-157.85,1.36-7.49,1.41-7.44.2-1.21,1.41-7.49,1.36-7.44L230.76.06h23.6l-3.52,19.14-1.36,7.44-1.41,7.49-.65,3.44-1.36,7.49-1.41,7.54-23.9,129.71h.6l13.49.1-4.78,21.52h17.01l-.2,1.16-2.57,13.77h186.69v-.05h-.01Z",
  // Diagonal vector top
  "M254.35,0l-33.01,182.26h-.6L254.35,0h0Z",
];

type Pt = [number, number];

/**
 * Every path as polylines in VIEWBOX units (y down), curves sampled at
 * `perCurve` steps. Handles the commands the mark uses — M L H V C S Z, each
 * absolute or relative, with implicit repeats.
 */
export function brandmarkPolylines(perCurve = 4): Pt[][] {
  const out: Pt[][] = [];
  for (const d of BRANDMARK_PATHS) {
    const tokens = d.match(/[MmLlHhVvCcSsZz]|-?(?:\d+\.\d*|\.\d+|\d+)(?:e[-+]?\d+)?/g) ?? [];
    let i = 0;
    let cmd = "";
    let cur: Pt = [0, 0];
    let start: Pt = [0, 0];
    let lastCtrl: Pt | null = null;
    let line: Pt[] = [];
    const num = () => Number(tokens[i++]);
    const flush = () => {
      if (line.length > 1) out.push(line);
      line = [];
    };
    const cubic = (p1: Pt, p2: Pt, p3: Pt) => {
      const p0 = cur;
      for (let k = 1; k <= perCurve; k++) {
        const t = k / perCurve;
        const u = 1 - t;
        line.push([
          u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ]);
      }
      lastCtrl = p2;
      cur = p3;
    };
    while (i < tokens.length) {
      if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
      const rel = cmd === cmd.toLowerCase();
      const ox = rel ? cur[0] : 0;
      const oy = rel ? cur[1] : 0;
      switch (cmd.toUpperCase()) {
        case "M": {
          flush();
          cur = [ox + num(), oy + num()];
          start = cur;
          line = [cur];
          lastCtrl = null;
          /* Implicit repeats after a moveto are linetos. */
          cmd = rel ? "l" : "L";
          break;
        }
        case "L":
          cur = [ox + num(), oy + num()];
          line.push(cur);
          lastCtrl = null;
          break;
        case "H":
          cur = [(rel ? cur[0] : 0) + num(), cur[1]];
          line.push(cur);
          lastCtrl = null;
          break;
        case "V":
          cur = [cur[0], (rel ? cur[1] : 0) + num()];
          line.push(cur);
          lastCtrl = null;
          break;
        case "C": {
          const p1: Pt = [ox + num(), oy + num()];
          const p2: Pt = [ox + num(), oy + num()];
          const p3: Pt = [ox + num(), oy + num()];
          cubic(p1, p2, p3);
          break;
        }
        case "S": {
          const p1: Pt = lastCtrl ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]] : cur;
          const p2: Pt = [ox + num(), oy + num()];
          const p3: Pt = [ox + num(), oy + num()];
          cubic(p1, p2, p3);
          break;
        }
        case "Z":
          line.push(start);
          cur = start;
          lastCtrl = null;
          flush();
          break;
        default:
          i++;
      }
    }
    flush();
  }
  return out;
}
