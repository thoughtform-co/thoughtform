"use client";

import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  src: string;
}

/**
 * A minimal GLB turntable viewer for the avatar preview route.
 *
 * Uses the drei `useGLTF` loader (SUSPENDS during load), auto-fits the
 * mesh into a unit-and-a-half cube, orbits slowly, and yields to
 * `OrbitControls` for manual inspection. Disposes on unmount.
 *
 * Kept in the preview route folder (not shared with
 * `voidwalker-avatar-lab`) because the props are different: the lab
 * viewer takes a `modelPath` from the registry, this one takes an
 * arbitrary preview URL from the sync cache. Deliberately duplicated
 * for path clarity.
 */
export function GlbViewer({ src }: Props) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.1, 3.0], fov: 34 }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 4]} intensity={1.15} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#caa554" />
      <Turntable>
        <Mesh src={src} />
      </Turntable>
      <OrbitControls
        enableZoom
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(2 * Math.PI) / 3}
        minDistance={2.2}
        maxDistance={5.5}
      />
    </Canvas>
  );
}

function Turntable({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.35 * dt;
  });
  return <group ref={ref}>{children}</group>;
}

function Mesh({ src }: { src: string }) {
  const gltf = useGLTF(src) as unknown as { scene: THREE.Group };
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
