"use client";

import { useEffect, useRef, useState } from "react";

import { SURI_MAP_3D } from "../data/suriCase";
import type { Figure } from "../types";

type CloudFigure = Extract<Figure, { kind: "cloud" }>;

const MAPS: Record<CloudFigure["map"], typeof SURI_MAP_3D> = { "suri-library": SURI_MAP_3D };

/* the asset library's own group colours (`library/app/src/lib/map.ts`) and
   its dimmed point; the ground is its map's `#151515` */
const GROUP_COLOURS = ["#4e624d", "#bc8767", "#a3b8cd", "#bbcacb", "#e2c3a8", "#ccb684", "#b19b6b", "#ebc19a", "#ceae9b", "#d6e7d5", "#e6e8ce", "#f5dbd0"];
const GROUND = "#151515";

/** A group's colour, by its index in the map, as the library cycles them. */
const colourOf = (g: number) => GROUP_COLOURS[g % GROUP_COLOURS.length];

/**
 * Cloud: the library's own map, in 3D, as the app draws it: a point per item
 * in its group's colour on its dark ground, the named groups lettered where
 * they sit and listed with their sizes, turning slowly. The positions are the
 * real layout, quantised, with no id, name or frame (`prep-suri-case.mjs`).
 *
 * three.js is loaded by `import()` once the figure nears the screen, never
 * statically (the arcs' import doctrine); it renders only while on screen,
 * at most 1.5 device pixels, and a still or reduced motion draws one frame.
 */
export function Cloud({ figure, still }: { figure: CloudFigure; still: boolean }) {
  const map = MAPS[figure.map];
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop = () => {};
    let started = false;
    const near = new IntersectionObserver(
      (es) => {
        if (started || !es.some((e) => e.isIntersecting)) return;
        started = true;
        near.disconnect();
        void start(el).then((s) => {
          stop = s;
        });
      },
      { rootMargin: "50% 0px" }
    );
    near.observe(el);

    async function start(box: HTMLDivElement): Promise<() => void> {
      const [THREE, buf] = await Promise.all([
        import("three"),
        fetch(map.src).then((r) => r.arrayBuffer()),
      ]);
      const n = new Uint32Array(buf, 0, 1)[0];
      const q = new Int16Array(buf, 4, n * 3);
      const grp = new Uint8Array(buf, 4 + n * 6, n);
      const k = 1.2 / 32767;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n * 3; i++) pos[i] = q[i] * k;
      /* every group in its colour, as the library draws it; the groups the
         list names at full strength, the rest a step back */
      const named = new Set(figure.named.map((g) => g.group));
      const col = new Float32Array(n * 3);
      const c = new THREE.Color();
      const ground = new THREE.Color(GROUND);
      for (let i = 0; i < n; i++) {
        c.set(colourOf(grp[i]));
        if (!named.has(grp[i])) c.lerp(ground, 0.55);
        col.set([c.r, c.g, c.b], i * 3);
      }

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(GROUND);
      box.prepend(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 50);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const disc = document.createElement("canvas");
      disc.width = disc.height = 64;
      const g2 = disc.getContext("2d");
      if (g2) {
        g2.beginPath();
        g2.arc(32, 32, 30, 0, Math.PI * 2);
        g2.fillStyle = "#fff";
        g2.fill();
      }
      const tex = new THREE.CanvasTexture(disc);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        map: tex,
        alphaTest: 0.5,
        sizeAttenuation: true,
      });
      const pts = new THREE.Points(geo, mat);
      pts.rotation.x = -0.18;
      scene.add(pts);

      const centres = figure.named.map((g) => {
        const [, x, y, z] = map.groups[g.group];
        return new THREE.Vector3(x, y, z);
      });
      const v = new THREE.Vector3();

      const size = () => {
        const w = box.clientWidth;
        const h = box.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        /* fit the cloud by the binding axis */
        camera.position.set(0, 0, w / h < 1.2 ? 2.7 : 2.2);
        camera.updateProjectionMatrix();
      };
      size();

      const frame = () => {
        renderer.render(scene, camera);
        const w = box.clientWidth;
        const h = box.clientHeight;
        centres.forEach((p, i) => {
          const el = labels.current[i];
          if (!el) return;
          v.copy(p).applyMatrix4(pts.matrixWorld).project(camera);
          el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
        });
      };

      const calm = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let raf = 0;
      let on = false;
      let last = performance.now();
      const loop = (now: number) => {
        pts.rotation.y += Math.min(50, now - last) * 0.00006;
        last = now;
        frame();
        raf = on ? requestAnimationFrame(loop) : 0;
      };
      pts.rotation.y = 0.6;
      pts.updateMatrixWorld();
      frame();
      setLive(true);

      const seen = new IntersectionObserver((es) => {
        const vis = es.some((e) => e.isIntersecting);
        if (calm) return;
        if (vis && !on) {
          on = true;
          last = performance.now();
          raf = requestAnimationFrame(loop);
        } else if (!vis) {
          on = false;
        }
      });
      seen.observe(box);
      const ro = new ResizeObserver(() => {
        size();
        frame();
      });
      ro.observe(box);

      return () => {
        on = false;
        cancelAnimationFrame(raf);
        seen.disconnect();
        ro.disconnect();
        geo.dispose();
        mat.dispose();
        tex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    return () => {
      near.disconnect();
      stop();
    };
  }, [map, figure.named, still]);

  return (
    <div
      className="csd-cloud"
      data-live={live ? "" : undefined}
      role="img"
      aria-label={`${figure.title}: ${figure.note} Named: ${figure.named.map((g) => g.text).join(", ")}.`}
    >
      <div className="csd-cloud__stage" ref={host}>
        {figure.named.map((g, i) => (
          <span
            key={g.group}
            className="csd-cloud__tag"
            ref={(el) => {
              labels.current[i] = el;
            }}
          >
            {g.text}
          </span>
        ))}
        <div className="csd-cloud__head" aria-hidden="true">
          <p className="csd-cloud__title">{figure.title}</p>
          <p className="csd-cloud__note">{figure.note}</p>
        </div>
      </div>
      <ul className="csd-cloud__list" aria-hidden="true">
        {figure.named.map((g) => (
          <li key={g.group}>
            <i style={{ background: colourOf(g.group) }} />
            <span>{g.text}</span>
            <em>{map.groups[g.group][0].toLocaleString("en-GB")}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
