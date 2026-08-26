"use client";

import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  modelPath: string;
  /** Radians per second. Default: 0.35, ~18°/s (slow, video-game character-select). */
  turnRateRadS?: number;
}

/**
 * The lab's era mesh viewer.
 *
 * One `<Canvas>`, one `useGLTF` load, one slow turntable rotation, one
 * OrbitControls for manual inspection. This is a LAB viewer — the
 * production stage will mount the same GLB inside the corridor R3F
 * canvas, not open a second context.
 *
 * ⚠ The GLB has to be present at `modelPath`. If it isn't, the
 * `<Suspense>` above never resolves, and the lab card stays on the still
 * — deliberate behaviour, mirrors the production fallback.
 */
export function EraModelViewer({ modelPath, turnRateRadS = 0.35 }: Props) {
  return (
    <div className="avatar-lab__mesh">
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 1.2, 3.2], fov: 34 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 4]} intensity={1.2} castShadow={false} />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#caa554" />
        <Turntable turnRateRadS={turnRateRadS}>
          <EraMesh modelPath={modelPath} />
        </Turntable>
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
          minDistance={2.4}
          maxDistance={5.5}
        />
      </Canvas>
    </div>
  );
}

function Turntable({
  turnRateRadS,
  children,
}: {
  turnRateRadS: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += turnRateRadS * dt;
  });
  return <group ref={ref}>{children}</group>;
}

function EraMesh({ modelPath }: { modelPath: string }) {
  const gltf = useGLTF(modelPath) as unknown as { scene: THREE.Group };
  // Fit-to-frame: measure the mesh's bounding box once and scale it so
  // the longest axis fits in a unit cube, then re-centre. Meshy's output
  // is normalised to real-world scale by default, which for a person is
  // ~1.7 units tall.
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const target = 2.4;
    const longest = Math.max(size.x, size.y, size.z);
    const scale = longest > 0 ? target / longest : 1;
    cloned.scale.setScalar(scale);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    return cloned;
  }, [gltf.scene]);

  useEffect(() => {
    return () => {
      // Dispose the cloned scene on unmount — the loader cache keeps
      // the original for re-use.
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of materials) m.dispose();
        }
      });
    };
  }, [scene]);

  return <primitive object={scene} />;
}
