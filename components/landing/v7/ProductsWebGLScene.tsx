"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { PRODUCTS, type ProductEntry } from "./productsData";

const CARD_SPACING = 4.8;
const CARD_COUNT = PRODUCTS.length;
const PARTICLE_COUNT = 1200;
const AMBIENT_PARTICLE_COUNT = 600;

interface SceneProps {
  activeIndex: number;
  targetIndex: number;
  onCardClick: (index: number) => void;
  isHovered: boolean;
}

function DepthParticles() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(AMBIENT_PARTICLE_COUNT * 3);
    for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.08;
    ref.current.rotation.y = t * 0.1;
    ref.current.rotation.x = Math.sin(t * 0.3) * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ECE3D6"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.35}
      />
    </Points>
  );
}

function CardParticleField({
  product,
  index,
  activeIndex,
}: {
  product: ProductEntry;
  index: number;
  activeIndex: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const isActive = index === activeIndex;
  const xOffset = index * CARD_SPACING;

  const positions = useMemo(() => {
    const count = PARTICLE_COUNT;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2.4;
      const height = (Math.random() - 0.5) * 3.2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius * 0.6 - 1.5;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.05;
    const targetOpacity = isActive ? 0.5 : 0.12;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity += (targetOpacity - mat.opacity) * 0.04;
  });

  return (
    <group position={[xOffset, 0, 0]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={product.glowColor}
          size={0.04}
          sizeAttenuation
          depthWrite={false}
          opacity={0.12}
        />
      </Points>
    </group>
  );
}

function CameraController({ targetIndex }: { targetIndex: number }) {
  const { camera } = useThree();
  const targetX = useRef(0);

  useFrame(() => {
    targetX.current = targetIndex * CARD_SPACING;
    camera.position.x += (targetX.current - camera.position.x) * 0.06;
    camera.position.y += (0 - camera.position.y) * 0.06;
    camera.position.z += (6.5 - camera.position.z) * 0.06;
  });

  return null;
}

function Scene({ activeIndex, targetIndex, isHovered }: SceneProps) {
  return (
    <>
      <CameraController targetIndex={targetIndex} />
      <ambientLight intensity={0.15} />
      <DepthParticles />
      {PRODUCTS.map((product, i) => (
        <CardParticleField key={product.id} product={product} index={i} activeIndex={activeIndex} />
      ))}
    </>
  );
}

interface ProductCardOverlayProps {
  product: ProductEntry;
  index: number;
  activeIndex: number;
  onClick: () => void;
}

function ProductCardOverlay({ product, index, activeIndex, onClick }: ProductCardOverlayProps) {
  const isActive = index === activeIndex;
  const offset = index - activeIndex;

  const transform = `
    translateX(calc(${offset * 105}% + ${offset * 32}px))
    scale(${isActive ? 1 : 0.88})
  `;

  const statusClass =
    product.status === "live"
      ? "products-card__status--live"
      : product.status === "preview"
        ? "products-card__status--preview"
        : "products-card__status--forge";

  return (
    <article
      className={`products-card ${isActive ? "products-card--active" : ""}`}
      style={{
        transform,
        opacity: Math.abs(offset) > 1.5 ? 0 : isActive ? 1 : 0.5,
        zIndex: isActive ? 10 : 5 - Math.abs(offset),
        pointerEvents: Math.abs(offset) > 1 ? "none" : "auto",
      }}
      onClick={onClick}
      role="button"
      tabIndex={isActive ? 0 : -1}
    >
      <div className="products-card__chrome">
        <span className="products-card__corner products-card__corner--tl" />
        <span className="products-card__corner products-card__corner--br" />
      </div>

      <header className="products-card__head">
        <span className="products-card__tag">
          <span className="products-card__diamond" />
          {product.id}
        </span>
        <span className={`products-card__status ${statusClass}`}>{product.statusLabel}</span>
      </header>

      <h3 className="products-card__name">{product.name}</h3>
      <p className="products-card__tagline">{product.tagline}</p>

      <p className="products-card__synopsis">{product.synopsis}</p>

      <ul className="products-card__caps">
        {product.capabilities.map((cap) => (
          <li key={cap}>{cap}</li>
        ))}
      </ul>

      <footer className="products-card__foot">
        <span className="products-card__url">
          {product.url === "#" ? "Coming soon" : `thoughtform.co${product.url}`}
        </span>
        <span className="products-card__arrow">→</span>
      </footer>
    </article>
  );
}

interface ProductsWebGLSceneProps {
  containerEl: HTMLElement;
}

export function ProductsWebGLScene({ containerEl }: ProductsWebGLSceneProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const accumulatorRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const targetIndexRef = useRef(0);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);
  useEffect(() => {
    targetIndexRef.current = targetIndex;
  }, [targetIndex]);

  const advance = useCallback((delta: number) => {
    accumulatorRef.current += delta;
    const threshold = 80;
    if (Math.abs(accumulatorRef.current) >= threshold) {
      const direction = accumulatorRef.current > 0 ? 1 : -1;
      accumulatorRef.current = 0;
      setTargetIndex((prev) => {
        const next = prev + direction;
        return Math.max(0, Math.min(CARD_COUNT - 1, next));
      });
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!isHoveredRef.current) return;

      const idx = targetIndexRef.current;
      const atStart = idx === 0 && e.deltaY < 0;
      const atEnd = idx === CARD_COUNT - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;

      e.preventDefault();
      e.stopPropagation();
      advance(e.deltaY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [advance]);

  useEffect(() => {
    let rafId: number;
    let running = true;
    const tick = () => {
      if (!running) return;
      setActiveIndex((prev) => {
        if (prev === targetIndex) return prev;
        const diff = targetIndex - prev;
        if (Math.abs(diff) < 0.01) return targetIndex;
        return prev + diff * 0.12;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [targetIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setTargetIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setTargetIndex((prev) => Math.min(CARD_COUNT - 1, prev + 1));
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="products-webgl"
      onMouseEnter={() => {
        setIsHovered(true);
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        isHoveredRef.current = false;
        accumulatorRef.current = 0;
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Product gallery"
    >
      <div className="products-webgl__canvas">
        <CanvasErrorBoundary>
          <Canvas
            gl={{
              antialias: false,
              alpha: true,
              powerPreference: "low-power",
            }}
            dpr={
              typeof window !== "undefined" && window.innerWidth < 768
                ? 1
                : Math.min(1.5, window.devicePixelRatio)
            }
            camera={{ position: [0, 0, 6.5], fov: 50 }}
            style={{ background: "transparent" }}
          >
            <Scene
              activeIndex={activeIndex}
              targetIndex={targetIndex}
              onCardClick={(i) => setTargetIndex(i)}
              isHovered={isHovered}
            />
          </Canvas>
        </CanvasErrorBoundary>
      </div>

      <div className="products-webgl__overlay">
        {PRODUCTS.map((product, i) => (
          <ProductCardOverlay
            key={product.id}
            product={product}
            index={i}
            activeIndex={activeIndex}
            onClick={() => setTargetIndex(i)}
          />
        ))}
      </div>

      <div className="products-webgl__nav">
        {PRODUCTS.map((_, i) => (
          <button
            key={i}
            className={`products-webgl__dot ${i === targetIndex ? "products-webgl__dot--active" : ""}`}
            onClick={() => setTargetIndex(i)}
            aria-label={`Go to ${PRODUCTS[i].name}`}
          />
        ))}
      </div>

      <div className="products-webgl__hint" aria-hidden="true">
        {isHovered && <span>Scroll to explore</span>}
      </div>
    </div>
  );
}
