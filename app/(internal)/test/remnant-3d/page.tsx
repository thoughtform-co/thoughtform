"use client";

/**
 * /test/remnant-3d â€” dev lab for the Gateway key visual rebuilt as 3D geometry.
 *
 * The question this lab exists to answer: how far can the remnant structure be
 * orbited before the reconstruction stops holding up? Roughly half the object is
 * never observed in the source plate, so past some angle the viewer is looking at
 * invented geometry. ADR-027 measured ~2.5 degrees for the depth-relief treatment
 * on this same plate; real geometry should do better, but the number has to be
 * measured rather than assumed â€” hence the orbit readout and the A/B overlay.
 *
 * Controls: ribbon (plies, fray), spine (spar length / bend / rise), material,
 * and a plate overlay that composites `plate-2560.webp` over the render at the
 * reference camera so silhouette drift is directly visible.
 *
 * Internal route â€” blocked from production by `proxy.ts`.
 * Control-panel pattern mirrors /test/brandmark-3d.
 */

import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Remnant3D, RIBBON_DEFAULTS } from "@/components/brand/Remnant3D";
import { DEFAULT_SPINE_PARAMS } from "@/components/brand/Remnant3D/remnantSpine";
import { RoomEnvironmentRig } from "@/components/brand/Brandmark3D";

const PLATE = "/gateway-motion/gateway-v1b/plate-2560.webp";

/**
 * The reference camera. Azimuth 0 is the viewpoint the plate was reconstructed
 * from â€” the only angle where every visible surface is evidence rather than
 * inference.
 */
// Remnant3D normalizes itself to a unit bounding sphere, so this distance is
// stable across spine tuning.
const REF_DISTANCE = 3.4;
const REF_ELEVATION = 0;

// RIBBON_DEFAULTS is `as const`, so its numbers narrow to literal types and the
// sliders cannot write back to them. Widen on the way in.
const DEFAULTS = {
  plies: RIBBON_DEFAULTS.plies as number,
  fray: RIBBON_DEFAULTS.fray as number,
  frayParticles: 9000,
  fraySize: 0.004,
  sparLen: DEFAULT_SPINE_PARAMS.sparLen,
  sparCurvature: DEFAULT_SPINE_PARAMS.sparCurvature,
  sparRise: DEFAULT_SPINE_PARAMS.sparRise,
  turns: DEFAULT_SPINE_PARAMS.turns,
  plateColor: "#d8d0c2",
  substrateColor: "#2a2622",
  roughness: 0.72,
  plyContrast: 0.55,
  envIntensity: 1,
  wireframe: false,
  azimuth: 0,
  elevation: REF_ELEVATION,
  overlay: 0,
  autoRotate: 0,
};

type Key = keyof typeof DEFAULTS;

export default function RemnantLabPage() {
  const [v, setV] = useState(DEFAULTS);
  const set = useCallback(
    <K extends Key>(k: K, value: (typeof DEFAULTS)[K]) => setV((p) => ({ ...p, [k]: value })),
    []
  );

  const spine = useMemo(
    () => ({
      sparLen: v.sparLen,
      sparCurvature: v.sparCurvature,
      sparRise: v.sparRise,
      turns: v.turns,
      phase: DEFAULT_SPINE_PARAMS.phase,
    }),
    [v.sparLen, v.sparCurvature, v.sparRise, v.turns]
  );

  // Orbit is driven by sliders, not OrbitControls, so the azimuth readout is an
  // exact number that can be recorded â€” the whole point of the lab.
  const camera = useMemo(() => {
    const az = (v.azimuth * Math.PI) / 180;
    const el = (v.elevation * Math.PI) / 180;
    return [
      REF_DISTANCE * Math.cos(el) * Math.sin(az),
      REF_DISTANCE * Math.sin(el),
      REF_DISTANCE * Math.cos(el) * Math.cos(az),
    ] as [number, number, number];
  }, [v.azimuth, v.elevation]);

  const offRef = Math.abs(v.azimuth) > 0.01 || Math.abs(v.elevation - REF_ELEVATION) > 0.01;

  return (
    <main className="rl">
      <div className="rl__stage">
        <Canvas
          camera={{ position: camera, fov: 32, near: 0.1, far: 40 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => gl.setClearColor("#0a0908")}
        >
          <OrbitCamera position={camera} />
          <RoomEnvironmentRig intensity={v.envIntensity} blur={0.06} />
          <ambientLight intensity={0.26} color="#2a3038" />
          <directionalLight position={[6.2, 5.5, 5.6]} intensity={3.1} color="#fff4e2" />
          <directionalLight position={[-7, 2.5, -6.2]} intensity={0.85} color="#c8d4e0" />
          <Remnant3D
            plies={v.plies}
            fray={v.fray}
            frayParticles={v.frayParticles}
            fraySize={v.fraySize}
            plateColor={v.plateColor}
            substrateColor={v.substrateColor}
            roughness={v.roughness}
            plyContrast={v.plyContrast}
            envIntensity={v.envIntensity}
            wireframe={v.wireframe}
            autoRotate={v.autoRotate}
            spine={spine}
          />
        </Canvas>

        {v.overlay > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rl__plate" src={PLATE} alt="" style={{ opacity: v.overlay }} />
        ) : null}

        <div className="rl__hud">
          <span className={offRef ? "rl__badge rl__badge--off" : "rl__badge"}>
            {offRef ? "OFF REFERENCE" : "REFERENCE VIEW"}
          </span>
          <span>
            az {v.azimuth.toFixed(1)}&deg; &middot; el {v.elevation.toFixed(1)}&deg;
          </span>
        </div>
      </div>

      <aside className="rl__panel">
        <header>
          <h1>remnant&nbsp;07LF</h1>
          <button type="button" onClick={() => setV(DEFAULTS)}>
            reset all
          </button>
        </header>

        <Section title="orbit">
          <Slider
            label="azimuth"
            v={v.azimuth}
            min={-60}
            max={60}
            step={0.5}
            onChange={(n) => set("azimuth", n)}
          />
          <Slider
            label="elevation"
            v={v.elevation}
            min={-40}
            max={40}
            step={0.5}
            onChange={(n) => set("elevation", n)}
          />
          <Slider
            label="plate overlay"
            v={v.overlay}
            min={0}
            max={1}
            step={0.01}
            onChange={(n) => set("overlay", n)}
          />
          <Slider
            label="auto-rotate"
            v={v.autoRotate}
            min={0}
            max={0.6}
            step={0.01}
            onChange={(n) => set("autoRotate", n)}
          />
          <p className="rl__note">
            Overlay composites the source plate over the render. Walk azimuth out until the
            silhouette separates â€” that angle is the reconstruction&rsquo;s useful range.
          </p>
        </Section>

        <Section title="ribbon">
          <Slider
            label="plies"
            v={v.plies}
            min={1}
            max={48}
            step={1}
            onChange={(n) => set("plies", n)}
          />
          <Slider
            label="fray"
            v={v.fray}
            min={0}
            max={1}
            step={0.01}
            onChange={(n) => set("fray", n)}
          />
          <Slider
            label="fray particles"
            v={v.frayParticles}
            min={0}
            max={24000}
            step={500}
            onChange={(n) => set("frayParticles", n)}
          />
          <Slider
            label="fray size"
            v={v.fraySize}
            min={0.001}
            max={0.02}
            step={0.0005}
            onChange={(n) => set("fraySize", n)}
          />
        </Section>

        <Section title="spine">
          <Slider
            label="turns"
            v={v.turns}
            min={0.6}
            max={2.4}
            step={0.02}
            onChange={(n) => set("turns", n)}
          />
          <Slider
            label="spar length"
            v={v.sparLen}
            min={0.8}
            max={2.6}
            step={0.02}
            onChange={(n) => set("sparLen", n)}
          />
          <Slider
            label="spar bend"
            v={v.sparCurvature}
            min={-2.6}
            max={1.2}
            step={0.02}
            onChange={(n) => set("sparCurvature", n)}
          />
          <Slider
            label="spar rise"
            v={v.sparRise}
            min={-1}
            max={4}
            step={0.05}
            onChange={(n) => set("sparRise", n)}
          />
        </Section>

        <Section title="material">
          <Colour label="plating" v={v.plateColor} onChange={(c) => set("plateColor", c)} />
          <Colour
            label="substrate"
            v={v.substrateColor}
            onChange={(c) => set("substrateColor", c)}
          />
          <Slider
            label="roughness"
            v={v.roughness}
            min={0}
            max={1}
            step={0.01}
            onChange={(n) => set("roughness", n)}
          />
          <Slider
            label="ply contrast"
            v={v.plyContrast}
            min={0}
            max={1}
            step={0.01}
            onChange={(n) => set("plyContrast", n)}
          />
          <Slider
            label="env intensity"
            v={v.envIntensity}
            min={0}
            max={3}
            step={0.05}
            onChange={(n) => set("envIntensity", n)}
          />
          <label className="rl__check">
            <input
              type="checkbox"
              checked={v.wireframe}
              onChange={(e) => set("wireframe", e.target.checked)}
            />
            wireframe
          </label>
        </Section>
      </aside>

      <style jsx>{`
        .rl {
          display: grid;
          grid-template-columns: 1fr 340px;
          height: 100vh;
          background: #0a0908;
          color: #ebe3d6;
          font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
        }
        .rl__stage {
          position: relative;
          overflow: hidden;
        }
        .rl__plate {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          mix-blend-mode: difference;
        }
        .rl__hud {
          position: absolute;
          left: 20px;
          bottom: 18px;
          display: flex;
          gap: 14px;
          align-items: center;
          font-size: 12px;
          letter-spacing: 0.06em;
          color: rgba(235, 227, 214, 0.7);
        }
        .rl__badge {
          padding: 3px 9px;
          border: 1px solid rgba(202, 165, 84, 0.5);
          color: #caa554;
        }
        .rl__badge--off {
          border-color: rgba(220, 120, 80, 0.6);
          color: #dc7850;
        }
        .rl__panel {
          overflow-y: auto;
          padding: 22px 20px 60px;
          border-left: 1px solid rgba(235, 227, 214, 0.12);
          background: #0d0c0b;
        }
        .rl__panel header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 20px;
        }
        .rl__panel h1 {
          font-size: 13px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #caa554;
          margin: 0;
        }
        .rl__panel button {
          background: none;
          border: 1px solid rgba(235, 227, 214, 0.2);
          color: rgba(235, 227, 214, 0.65);
          font: inherit;
          font-size: 10px;
          padding: 3px 8px;
          cursor: pointer;
        }
        .rl__panel button:hover {
          border-color: rgba(202, 165, 84, 0.5);
          color: #caa554;
        }
        .rl__note {
          font-size: 10px;
          line-height: 1.5;
          color: rgba(235, 227, 214, 0.42);
          margin: 10px 0 0;
        }
        .rl__check {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 11px;
          color: rgba(235, 227, 214, 0.75);
          margin-top: 8px;
        }
      `}</style>
    </main>
  );
}

/**
 * Drives the camera imperatively.
 *
 * R3F applies `<Canvas camera={...}>` only on the FIRST render â€” later changes to
 * that prop are ignored. Without this the azimuth slider moves the readout but
 * not the camera, and the orbit measurement this lab exists for reads as "the
 * silhouette never changes", which is exactly the wrong conclusion.
 */
function OrbitCamera({ position }: { position: [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, position]);
  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
      <style jsx>{`
        section {
          margin-bottom: 26px;
        }
        h2 {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(235, 227, 214, 0.4);
          margin: 0 0 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(235, 227, 214, 0.1);
        }
      `}</style>
    </section>
  );
}

function Slider({
  label,
  v,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  v: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="s">
      <span className="s__row">
        <span>{label}</span>
        <em>{v.toFixed(step < 0.01 ? 4 : step < 1 ? 2 : 0)}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <style jsx>{`
        .s {
          display: block;
          margin-bottom: 11px;
        }
        .s__row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(235, 227, 214, 0.72);
          margin-bottom: 4px;
        }
        em {
          font-style: normal;
          color: #caa554;
        }
        input {
          width: 100%;
          accent-color: #caa554;
        }
      `}</style>
    </label>
  );
}

function Colour({
  label,
  v,
  onChange,
}: {
  label: string;
  v: string;
  onChange: (c: string) => void;
}) {
  return (
    <label className="c">
      <span>{label}</span>
      <input type="color" value={v} onChange={(e) => onChange(e.target.value)} />
      <style jsx>{`
        .c {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: rgba(235, 227, 214, 0.72);
          margin-bottom: 9px;
        }
        input {
          width: 46px;
          height: 20px;
          border: 1px solid rgba(235, 227, 214, 0.2);
          background: none;
          padding: 0;
          cursor: pointer;
        }
      `}</style>
    </label>
  );
}
