/**
 * turnWash — the turn's ground, warmed to the client's colour by a shader
 * (ADR-095 U1).
 *
 * The first cut ended the turn by sliding an opaque coral slab up over the
 * pinned stage. The owner's read: "an ugly paint that just floats over it",
 * and no panel should slide over the beat at all. So the ground CHANGES
 * instead of being covered: a fragment shader paints Trinny's coral into the
 * frame of the stage and leaves the centre almost clean, so the mark keeps
 * its bed and the headline that follows has somewhere to land. It swells to
 * its peak with the copy and RESOLVES back to the page's own parchment as
 * the copy leaves — so the proposal below begins on the house ground and
 * there is no seam anywhere for an edge to show.
 *
 * WHY A SHADER AND NOT TWO RADIAL GRADIENTS. A near-flat ramp across a whole
 * viewport is exactly where CSS gradients band, and this one is wide, low
 * contrast and sits on parchment where a step is obvious. The shader carries
 * an ordered dither of one 255th, which costs nothing and removes the banding
 * that made the first cut read as printed-on.
 *
 * ⚠ NO CLOCK. There is no `uTime` and no animation loop: the only input is
 * the turn's scroll progress, and `draw()` is called from the writer's own
 * rAF when that progress changed. Continuous motion behind readable content
 * is banned on this surface (ADR-021's addendum, the motion-sickness
 * ruling) — and a shader that idles would also burn a GPU on a parked page.
 *
 * ⚠ THE COLOUR COMES FROM CSS. `--tl-brand-rgb` on `.tl-root` is the one
 * definition of Trinny's coral; this reads it rather than restating it, so
 * the wash, the fallback mark and the proposal's rule can never drift.
 *
 * Fails soft: if the context is refused or lost, the caller is told and
 * paints the CSS fallback instead (a plain gradient — banding and all, but
 * a ground rather than nothing).
 */

const VERT = `
  attribute vec2 aPos;
  void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
  precision mediump float;
  uniform vec2 uRes;
  uniform vec3 uBrand;
  uniform float uAmount;   // 0 → 1, the wash's own clock

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    // Centre on the parked mark (54.5 % from the TOP; gl_FragCoord is
    // y-up), aspect-corrected so the field is round on any window.
    vec2 p = uv - vec2(0.5, 0.455);
    p.x *= uRes.x / max(1.0, uRes.y);
    float r = length(p);

    // The field takes the colour and the centre is left almost clean: the
    // mark sits at r < 0.24 and the headline lands on top of it, so both
    // keep a near-parchment bed while the ground around them turns.
    float edge = smoothstep(0.20, 0.66, r);
    // A diagonal bias off the lower right — the first cut's own direction,
    // kept so the light on the page still comes from one place.
    float bias = 0.68 + 0.32 * smoothstep(-0.45, 0.65, (uv.x - 0.5) * 0.85 + (0.5 - uv.y) * 0.65);

    // ⚠ THE WASH FILLS THE WHOLE VIEWPORT (owner, 2026-09-10: "that shader
    // should fill the full viewport. Right now it stops at the left and
    // right reel, but it should steadily fill the entire viewport" — and,
    // asked whether the rail should be protected: "I don't want you to
    // change the reel. Just extend that gradient, that shader, because the
    // color doesn't really clash with our reel, so we can easily extend").
    //
    // WHAT THAT TRADES, kept as the record rather than deleted with the
    // mask it explains. The first cut ran the field masked out of the outer
    // 7.5 % / 5.5 %, because at full bleed the ground runs under the right
    // rail's telemetry — gold values on coral — and on the still BEARING and
    // LOCAL were both gone at 1920×1247, legible again only once the wash
    // resolved. The owner has now read that and ruled the other way: the
    // page's colour takes the frame with it, and the rail is not touched.
    //
    // ⚠ SO THE PEAK IS THE ONE DIAL LEFT, and raising it re-opens exactly
    // that question with no guard to catch it — nothing anywhere measures
    // this shader's contrast, and the only witness is a capture. Re-shoot
    // the 15-turn-mark / 16-turn-line stills at 1920×1247 before moving 0.66.
    float a = uAmount * (edge * bias + 0.10 * (1.0 - edge));

    // Ordered dither — a wide, low-contrast ramp on parchment bands without
    // it, which is what made the flat version read as paint.
    float d = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    a += (d - 0.5) * (1.6 / 255.0);

    gl_FragColor = vec4(uBrand, clamp(a, 0.0, 1.0) * 0.66);
  }
`;

export interface TurnWash {
  /** Paint the wash at `amount` (0 → 1). Cheap and idempotent. */
  draw(amount: number): void;
  /** Re-read the canvas box (a resize, or the stage changing shape). */
  resize(): void;
  dispose(): void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/** Read `--tl-brand-rgb` ("240, 104, 80") off the route root as 0–1 floats. */
function brandColor(el: HTMLElement): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue("--tl-brand-rgb");
  const parts = raw.split(",").map((v) => Number.parseFloat(v.trim()));
  if (parts.length < 3 || parts.some((v) => !Number.isFinite(v))) return [0.94, 0.41, 0.31];
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
}

/**
 * Attach the wash to a canvas already in the stage. Returns `null` when
 * WebGL is unavailable — the caller then marks the stage for the CSS
 * fallback.
 */
export function createTurnWash(canvas: HTMLCanvasElement, root: HTMLElement): TurnWash | null {
  const gl = (canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    // The wash is redrawn only when the scroll moved, so the browser must
    // keep the last frame rather than clearing it between paints.
    preserveDrawingBuffer: true,
  }) || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = vs && fs ? gl.createProgram() : null;
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uBrand = gl.getUniformLocation(prog, "uBrand");
  const uAmount = gl.getUniformLocation(prog, "uAmount");
  gl.uniform3fv(uBrand, brandColor(root));

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let lost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
  };
  canvas.addEventListener("webglcontextlost", onLost);

  let w = 0;
  let h = 0;
  const resize = () => {
    // The ground is a soft field with no fine detail, so it is drawn at a
    // capped ratio: full DPR on a large window buys nothing here and costs
    // fill rate on a page that is already running the corridor.
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const nw = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const nh = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  };
  resize();

  let last = -1;
  return {
    draw(amount: number) {
      if (lost) return;
      const a = amount < 0 ? 0 : amount > 1 ? 1 : amount;
      if (Math.abs(a - last) < 0.002) return;
      last = a;
      gl.uniform1f(uAmount, a);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    resize() {
      resize();
      last = -1;
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
